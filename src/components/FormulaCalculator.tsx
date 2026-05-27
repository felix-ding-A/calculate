import { useState, useEffect } from 'react';
import { RefreshCw, Layers, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

interface PrepStep {
  order: number;
  action: string;
  detail: string;
  volume: number;
  unit: string;
}

interface FormulaResult {
  workingConc: number;
  totalVolume: number;
  recommendedVolume: number;
  drugAmount: number;
  dmsoVolume: number;
  stockConc: number;
  solubilityWarning: boolean;
  steps: PrepStep[];
  precautions: string[];
}

export default function FormulaCalculator() {
  const [activeTab, setActiveTab] = useState<'animal' | 'supplement' | 'cosmetic'>('animal');

  // ==========================================
  // STATE: ANIMAL FORMULATION
  // ==========================================
  const [dose, setDose] = useState<string>('10'); // mg/kg
  const [weight, setWeight] = useState<string>('20'); // g (e.g. mouse)
  const [volumePer, setVolumePer] = useState<string>('100'); // μL per animal
  const [count, setCount] = useState<string>('10'); // animal count
  const [solubilityLimit, setSolubilityLimit] = useState<string>('10'); // mg/mL in DMSO

  // Solvent Percentages (Must sum to 100%)
  const [dmsoPct, setDmsoPct] = useState<string>('10');
  const [pegPct, setPegPct] = useState<string>('40');
  const [tweenPct, setTweenPct] = useState<string>('5');
  const [waterPct, setWaterPct] = useState<string>('45');
  const [cornOilPct, setCornOilPct] = useState<string>('0');

  const [result, setResult] = useState<FormulaResult | null>(null);
  const [pctError, setPctError] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'animal') {
      calculateAnimalFormula();
    }
  }, [dose, weight, volumePer, count, solubilityLimit, dmsoPct, pegPct, tweenPct, waterPct, cornOilPct, activeTab]);

  const calculateAnimalFormula = () => {
    setPctError('');
    
    // Parse values
    const dVal = parseFloat(dose);
    const wVal = parseFloat(weight);
    const vPerVal = parseFloat(volumePer);
    const cVal = parseFloat(count);
    const limitVal = parseFloat(solubilityLimit);

    const dPct = parseFloat(dmsoPct) || 0;
    const pPct = parseFloat(pegPct) || 0;
    const tPct = parseFloat(tweenPct) || 0;
    const wPct = parseFloat(waterPct) || 0;
    const oPct = parseFloat(cornOilPct) || 0;

    // Check sum of percentages
    const sumPct = dPct + pPct + tPct + wPct + oPct;
    if (Math.abs(sumPct - 100) > 0.01) {
      setPctError(`配方比例之和必须为 100% (当前为 ${sumPct.toFixed(1)}%)`);
      setResult(null);
      return;
    }

    if (isNaN(dVal) || isNaN(wVal) || isNaN(vPerVal) || isNaN(cVal) || dVal <= 0 || wVal <= 0 || vPerVal <= 0 || cVal <= 0) {
      setResult(null);
      return;
    }

    // 1. Calculate Drug Per Animal: dose (mg/kg) * weight (g) / 1000 = mg
    const drugPerAnimal = (dVal * wVal) / 1000;

    // 2. Working Concentration (mg/mL): drug (mg) / volumePer (uL) * 1000
    const workingConc = (drugPerAnimal / vPerVal) * 1000;

    // 3. Total Volume Required (with 1 extra animal safety margin)
    const recommendedVolume = vPerVal * (cVal + 1); // in μL
    const theoreticalVolume = vPerVal * cVal;

    // 4. Stock Preparation
    const totalVolumeMl = recommendedVolume / 1000;
    const totalDrug = workingConc * totalVolumeMl; // in mg
    const dmsoVolume = recommendedVolume * (dPct / 100); // in μL
    const stockConc = totalDrug / (dmsoVolume / 1000); // in mg/mL

    const solubilityWarning = stockConc > limitVal;

    // 5. Build Preparation Steps
    const steps: PrepStep[] = [];
    let stepOrder = 1;

    // Step 1: Weigh and dissolve in DMSO
    steps.push({
      order: stepOrder++,
      action: `称量 ${totalDrug.toFixed(2)} mg 待测药物，加入 ${dmsoVolume.toFixed(1)} μL DMSO 中。`,
      detail: `充分振荡混匀或涡旋，确保药物完全溶解。此时母液浓度为 ${stockConc.toFixed(2)} mg/mL。`,
      volume: dmsoVolume,
      unit: 'μL'
    });

    if (pPct > 0) {
      const vol = recommendedVolume * (pPct / 100);
      steps.push({
        order: stepOrder++,
        action: `加入 ${vol.toFixed(1)} μL PEG300。`,
        detail: `混匀至溶液澄清，如遇难溶可微温水浴、超声或涡旋助溶。`,
        volume: vol,
        unit: 'μL'
      });
    }

    if (tPct > 0) {
      const vol = recommendedVolume * (tPct / 100);
      steps.push({
        order: stepOrder++,
        action: `加入 ${vol.toFixed(1)} μL Tween 80。`,
        detail: `混匀，确保完全增溶，无油脂状液滴挂壁。`,
        volume: vol,
        unit: 'μL'
      });
    }

    if (wPct > 0) {
      const vol = recommendedVolume * (wPct / 100);
      steps.push({
        order: stepOrder++,
        action: `缓慢加入 ${vol.toFixed(1)} μL ddH₂O (纯化水)。`,
        detail: `边加边摇匀，使体系完全水合。若出现浑浊，需考虑增加增溶剂比例。`,
        volume: vol,
        unit: 'μL'
      });
    }

    if (oPct > 0) {
      const vol = recommendedVolume * (oPct / 100);
      steps.push({
        order: stepOrder++,
        action: `加入 ${vol.toFixed(1)} μL Corn oil (玉米油)。`,
        detail: `用力震荡或涡旋混匀，制备成均一的油相注射液。`,
        volume: vol,
        unit: 'μL'
      });
    }

    setResult({
      workingConc: parseFloat(workingConc.toFixed(4)),
      totalVolume: theoreticalVolume,
      recommendedVolume,
      drugAmount: parseFloat(totalDrug.toFixed(3)),
      dmsoVolume: parseFloat(dmsoVolume.toFixed(1)),
      stockConc: parseFloat(stockConc.toFixed(2)),
      solubilityWarning,
      steps,
      precautions: [
        '必须严格按照SOP中1、2、3、4的加样顺序依次加入溶剂，否则药物极易析出。',
        '每加入一步溶剂，都必须混匀至溶液呈澄清状态后，才能进行下一步加样。',
        '配制好的药液建议即配即用，避免长期放置导致活性成分降解或析出结晶。',
        solubilityWarning ? '警告：当前配方算得的母液浓度已超出设定的溶解度上限，请增加DMSO比例或缩减给药体积。' : '当前配方算得的母液浓度在安全溶解范围内，可以配制。'
      ]
    });
  };

  const setFormulationMode = (mode: 'water' | 'oil') => {
    if (mode === 'water') {
      setDmsoPct('10');
      setPegPct('40');
      setTweenPct('5');
      setWaterPct('45');
      setCornOilPct('0');
    } else {
      setDmsoPct('10');
      setPegPct('0');
      setTweenPct('0');
      setWaterPct('0');
      setCornOilPct('90');
    }
  };

  const handleReset = () => {
    setDose('10');
    setWeight('20');
    setVolumePer('100');
    setCount('10');
    setSolubilityLimit('10');
    setFormulationMode('water');
  };

  return (
    <div className="calculator-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="glow-title" style={{ fontSize: '28px', textAlign: 'left' }}>配方配制计算器</h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '14px', textAlign: 'left', marginTop: '4px' }}>
            科研动物给药多溶剂混溶方案设计与 SOP 步骤生成
          </p>
        </div>
        
        {/* Toggle between Selleck and Industry Mode placeholder tabs to show future extensibility */}
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'animal' ? 'active' : ''}`} onClick={() => setActiveTab('animal')}>
            动物体内给药配方
          </button>
          <button
            className={`tab-btn ${activeTab === 'supplement' ? 'active' : ''}`}
            onClick={() => setActiveTab('supplement')}
            style={{ position: 'relative' }}
          >
            保健品配方 (二期)
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--neon-emerald)', color: '#000', fontSize: '9px', padding: '1px 3px', borderRadius: '4px', scale: '0.85', fontWeight: 'bold' }}>UPCOMING</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'cosmetic' ? 'active' : ''}`}
            onClick={() => setActiveTab('cosmetic')}
            style={{ position: 'relative' }}
          >
            化妆品配方 (二期)
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--neon-violet)', color: '#fff', fontSize: '9px', padding: '1px 3px', borderRadius: '4px', scale: '0.85', fontWeight: 'bold' }}>UPCOMING</span>
          </button>
        </div>
      </div>

      {activeTab === 'animal' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Left panel inputs */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label-glass" style={{ fontSize: '14px' }}>第一步：输入给药基本参数</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-glass" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setFormulationMode('water')}>水相体系模板</button>
                <button className="btn btn-glass" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setFormulationMode('oil')}>油相体系模板</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="label-glass">单次给药剂量 (mg/kg)</label>
                <input type="number" className="input-glass input-glass-mono" value={dose} onChange={(e) => setDose(e.target.value)} />
              </div>
              <div>
                <label className="label-glass">动物平均体重 (g)</label>
                <input type="number" className="input-glass input-glass-mono" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div>
                <label className="label-glass">单只给药体积 (μL)</label>
                <input type="number" className="input-glass input-glass-mono" value={volumePer} onChange={(e) => setVolumePer(e.target.value)} />
              </div>
              <div>
                <label className="label-glass">实验动物数量 (只)</label>
                <input type="number" className="input-glass input-glass-mono" value={count} onChange={(e) => setCount(e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="label-glass">药物在 DMSO 中的溶解度上限 (mg/mL)</label>
                <input type="number" className="input-glass input-glass-mono" value={solubilityLimit} onChange={(e) => setSolubilityLimit(e.target.value)} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '6px' }}>
              <span className="label-glass" style={{ fontSize: '14px', marginBottom: '14px' }}>第二步：设计配方百分比比重 (需凑足100%)</span>
              {pctError && <div className="alert-glass alert-glass-danger" style={{ marginBottom: '12px', fontSize: '12px', padding: '8px 12px' }}>{pctError}</div>}
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                <div>
                  <label className="label-glass" style={{ fontSize: '10px' }}>DMSO (%)</label>
                  <input type="number" className="input-glass input-glass-mono" value={dmsoPct} onChange={(e) => setDmsoPct(e.target.value)} />
                </div>
                <div>
                  <label className="label-glass" style={{ fontSize: '10px' }}>PEG300 (%)</label>
                  <input type="number" className="input-glass input-glass-mono" value={pegPct} onChange={(e) => setPegPct(e.target.value)} />
                </div>
                <div>
                  <label className="label-glass" style={{ fontSize: '10px' }}>Tween 80 (%)</label>
                  <input type="number" className="input-glass input-glass-mono" value={tweenPct} onChange={(e) => setTweenPct(e.target.value)} />
                </div>
                <div>
                  <label className="label-glass" style={{ fontSize: '10px' }}>ddH₂O (%)</label>
                  <input type="number" className="input-glass input-glass-mono" value={waterPct} onChange={(e) => setWaterPct(e.target.value)} />
                </div>
                <div>
                  <label className="label-glass" style={{ fontSize: '10px' }}>玉米油 (%)</label>
                  <input type="number" className="input-glass input-glass-mono" value={cornOilPct} onChange={(e) => setCornOilPct(e.target.value)} />
                </div>
              </div>
            </div>

            <button className="btn btn-glass" style={{ alignSelf: 'flex-start', marginTop: '10px' }} onClick={handleReset}>
              <RefreshCw size={14} /> 重置配方
            </button>
          </div>

          {/* Right panel output SOP */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glow-title">
              <FileText size={16} /> 配方 SOP 制备方案报告
            </h3>

            {result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto', maxHeight: '480px' }} className="custom-scrollbar">
                {/* Info summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>给药工作液浓度</span>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>{result.workingConc} mg/mL</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>理论总液量 / 建议配制量</span>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--color-primary)' }}>
                      {result.totalVolume} / {result.recommendedVolume} μL
                    </p>
                    <span style={{ fontSize: '9px', color: 'var(--color-muted)' }}>（多算一只动物余量防止吸排损耗）</span>
                  </div>
                </div>

                {/* Solubility limit checking indicator */}
                {result.solubilityWarning ? (
                  <div className="alert-glass alert-glass-danger" style={{ fontSize: '13px', padding: '10px 14px' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>溶解度警报：</strong>算得的母液浓度为 <strong>{result.stockConc} mg/mL</strong>，已超出您的最大溶解度限制 ({solubilityLimit} mg/mL)。可能会产生析出结晶！
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(5,243,162,0.06)', border: '1px solid rgba(5,243,162,0.2)', borderRadius: '10px', color: 'var(--neon-emerald)', fontSize: '13px' }}>
                    <CheckCircle size={16} />
                    <span>母液浓度 <strong>{result.stockConc} mg/mL</strong> 处于安全溶解度上限内，配方可行。</span>
                  </div>
                )}

                {/* Steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span className="label-glass" style={{ fontSize: '12px' }}>分步加样配制指南 (SOP)</span>
                  {result.steps.map(step => (
                    <div key={step.order} style={{ display: 'flex', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--gradient-cyber)', color: '#000', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
                        {step.order}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-primary)' }}>{step.action}</p>
                        <p style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Precautions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '12px' }}>
                  <span className="label-glass" style={{ fontSize: '11px' }}>注意事项与备忘</span>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '16px', fontSize: '11px', color: 'var(--color-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {result.precautions.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', fontSize: '13px' }}>
                请在左侧输入正确参数以生成制备指南
              </div>
            )}
          </div>
        </div>
      ) : (
        // Premium Mockup UI for supplement & cosmetic enhancement
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', minHeight: '300px' }}>
          <Layers size={48} style={{ color: activeTab === 'supplement' ? 'var(--neon-emerald)' : 'var(--neon-violet)' }} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }} className="glow-title">
              {activeTab === 'supplement' ? '保健品配方与规格校验系统' : '化妆品多相乳化 HLB 计算系统'}
            </h3>
            <p style={{ color: 'var(--color-secondary)', fontSize: '14px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
              {activeTab === 'supplement' 
                ? '二期规划：包含片剂/硬胶囊/软胶囊/口服液专用生产配比模板。支持考虑投料损耗的实际投料量换算，辅料配伍禁忌检测，以及根据装量自动进行 #00-#4 胶囊型号匹配。'
                : '二期规划：支持 O/W 与 W/O 多相乳化体系设计。输入油相成分自动求出 Required HLB，并根据 HLB 推荐吐温/司盘等乳化剂复配占比；集成防腐挑战计算及 IFRA 安全上限警戒阀值。'}
            </p>
          </div>
          <button
            className="btn"
            style={{ background: activeTab === 'supplement' ? 'var(--gradient-emerald)' : 'var(--gradient-rose)', color: '#000', fontWeight: 'bold' }}
            onClick={() => setActiveTab('animal')}
          >
            返回动物体内给药计算器
          </button>
        </div>
      )}
    </div>
  );
}
