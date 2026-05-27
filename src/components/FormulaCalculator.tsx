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
      setPctError(`Solvent percentages must sum up to exactly 100% (currently ${sumPct.toFixed(1)}%)`);
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
      action: `Weigh ${totalDrug.toFixed(2)} mg of test compound, and add ${dmsoVolume.toFixed(1)} μL of DMSO.`,
      detail: `Vortex or shake thoroughly to ensure complete dissolution. The stock concentration is now ${stockConc.toFixed(2)} mg/mL.`,
      volume: dmsoVolume,
      unit: 'μL'
    });

    if (pPct > 0) {
      const vol = recommendedVolume * (pPct / 100);
      steps.push({
        order: stepOrder++,
        action: `Add ${vol.toFixed(1)} μL of PEG300.`,
        detail: `Mix until clear. If needed, use a warm water bath, sonication, or vortexing to assist dissolution.`,
        volume: vol,
        unit: 'μL'
      });
    }

    if (tPct > 0) {
      const vol = recommendedVolume * (tPct / 100);
      steps.push({
        order: stepOrder++,
        action: `Add ${vol.toFixed(1)} μL of Tween 80.`,
        detail: `Mix thoroughly to ensure complete solubilization without oil droplets on the tube wall.`,
        volume: vol,
        unit: 'μL'
      });
    }

    if (wPct > 0) {
      const vol = recommendedVolume * (wPct / 100);
      steps.push({
        order: stepOrder++,
        action: `Slowly add ${vol.toFixed(1)} μL of ddH₂O (sterile water).`,
        detail: `Mix continuously while adding water to ensure complete hydration. If precipitation/turbidity occurs, consider increasing solubilizers.`,
        volume: vol,
        unit: 'μL'
      });
    }

    if (oPct > 0) {
      const vol = recommendedVolume * (oPct / 100);
      steps.push({
        order: stepOrder++,
        action: `Add ${vol.toFixed(1)} μL of Corn oil.`,
        detail: `Vortex or shake vigorously to prepare a uniform oil-phase formulation.`,
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
        'Strictly follow the exact order of steps (1, 2, 3...) when adding solvents, otherwise the compound will precipitate.',
        'Ensure the solution is completely clear and mixed after each solvent addition before adding the next one.',
        'It is highly recommended to prepare the formulation fresh before use to avoid degradation or crystallisation.',
        solubilityWarning ? 'Warning: The calculated stock concentration exceeds the specified solubility limit. Increase DMSO percentage or decrease dosage volume.' : 'The calculated stock concentration is within the safe solubility limit.'
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
          <h2 className="glow-title" style={{ fontSize: '28px', textAlign: 'left' }}>Formulation Calculator</h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '14px', textAlign: 'left', marginTop: '4px' }}>
            Multi-solvent animal administration formulation solver & SOP generator
          </p>
        </div>
        
        {/* Toggle between tabs */}
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'animal' ? 'active' : ''}`} onClick={() => setActiveTab('animal')}>
            In Vivo Animal Recipe
          </button>
          <button
            className={`tab-btn ${activeTab === 'supplement' ? 'active' : ''}`}
            onClick={() => setActiveTab('supplement')}
            style={{ position: 'relative' }}
          >
            Supplement Formulation (Ph. 2)
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--neon-emerald)', color: '#000', fontSize: '9px', padding: '1px 3px', borderRadius: '4px', scale: '0.85', fontWeight: 'bold' }}>UPCOMING</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'cosmetic' ? 'active' : ''}`}
            onClick={() => setActiveTab('cosmetic')}
            style={{ position: 'relative' }}
          >
            Cosmetic Formulation (Ph. 2)
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--neon-violet)', color: '#fff', fontSize: '9px', padding: '1px 3px', borderRadius: '4px', scale: '0.85', fontWeight: 'bold' }}>UPCOMING</span>
          </button>
        </div>
      </div>

      {activeTab === 'animal' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Left panel inputs */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label-glass" style={{ fontSize: '14px' }}>Step 1: Animal Dosage Parameters</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-glass" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setFormulationMode('water')}>Aqueous System Template</button>
                <button className="btn btn-glass" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setFormulationMode('oil')}>Oil System Template</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="label-glass">Dosage per Injection (mg/kg)</label>
                <input type="number" className="input-glass input-glass-mono" value={dose} onChange={(e) => setDose(e.target.value)} />
              </div>
              <div>
                <label className="label-glass">Average Animal Weight (g)</label>
                <input type="number" className="input-glass input-glass-mono" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div>
                <label className="label-glass">Injection Volume per Animal (μL)</label>
                <input type="number" className="input-glass input-glass-mono" value={volumePer} onChange={(e) => setVolumePer(e.target.value)} />
              </div>
              <div>
                <label className="label-glass">Number of Animals</label>
                <input type="number" className="input-glass input-glass-mono" value={count} onChange={(e) => setCount(e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="label-glass">Solubility Limit in DMSO (mg/mL)</label>
                <input type="number" className="input-glass input-glass-mono" value={solubilityLimit} onChange={(e) => setSolubilityLimit(e.target.value)} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '6px' }}>
              <span className="label-glass" style={{ fontSize: '14px', marginBottom: '14px' }}>Step 2: Solvent Volume Percentages (Must sum to 100%)</span>
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
                  <label className="label-glass" style={{ fontSize: '10px' }}>Corn Oil (%)</label>
                  <input type="number" className="input-glass input-glass-mono" value={cornOilPct} onChange={(e) => setCornOilPct(e.target.value)} />
                </div>
              </div>
            </div>

            <button className="btn btn-glass" style={{ alignSelf: 'flex-start', marginTop: '10px' }} onClick={handleReset}>
              <RefreshCw size={14} /> Reset Recipe
            </button>
          </div>

          {/* Right panel output SOP */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glow-title">
              <FileText size={16} /> Formulation SOP & Preparation Report
            </h3>

            {result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto', maxHeight: '480px' }} className="custom-scrollbar">
                {/* Info summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Working Concentration</span>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>{result.workingConc} mg/mL</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Theoretical Vol / Suggested Preparation Vol</span>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--color-primary)' }}>
                      {result.totalVolume} / {result.recommendedVolume} μL
                    </p>
                    <span style={{ fontSize: '9px', color: 'var(--color-muted)' }}>(Includes 1 extra animal dead volume to cover pipetting loss)</span>
                  </div>
                </div>

                {/* Solubility limit checking indicator */}
                {result.solubilityWarning ? (
                  <div className="alert-glass alert-glass-danger" style={{ fontSize: '13px', padding: '10px 14px' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Solubility Alarm:</strong> Calculated stock concentration is <strong>{result.stockConc} mg/mL</strong>, which exceeds your maximum solubility limit ({solubilityLimit} mg/mL). Precipitation may occur!
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(5,243,162,0.06)', border: '1px solid rgba(5,243,162,0.2)', borderRadius: '10px', color: 'var(--neon-emerald)', fontSize: '13px' }}>
                    <CheckCircle size={16} />
                    <span>Stock concentration <strong>{result.stockConc} mg/mL</strong> is within the safe solubility limit. Recipe is viable.</span>
                  </div>
                )}

                {/* Steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span className="label-glass" style={{ fontSize: '12px' }}>Step-by-Step Preparation Guide (SOP)</span>
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
                  <span className="label-glass" style={{ fontSize: '11px' }}>Precautions & Notes</span>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '16px', fontSize: '11px', color: 'var(--color-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {result.precautions.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', fontSize: '13px' }}>
                Please enter valid parameters on the left to generate the SOP guide
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
              {activeTab === 'supplement' ? 'Nutraceutical Specification Checker' : 'Cosmetic Multi-Phase Emulsification HLB Solver'}
            </h3>
            <p style={{ color: 'var(--color-secondary)', fontSize: '14px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
              {activeTab === 'supplement' 
                ? 'Phase 2 Plan: Includes production formulation templates for tablets, hard capsules, soft capsules, and oral liquids. Supports raw material yield loss conversion, compatibility check, and automatic capsule size selection (#00-#4) based on fill volume.'
                : 'Phase 2 Plan: Supports O/W and W/O emulsification system designs. Input oil phases to automatically compute Required HLB and receive recommended Tween/Span blend ratios; integrates preservative challenge testing and IFRA safety threshold limit monitoring.'}
            </p>
          </div>
          <button
            className="btn"
            style={{ background: activeTab === 'supplement' ? 'var(--gradient-emerald)' : 'var(--gradient-rose)', color: '#000', fontWeight: 'bold' }}
            onClick={() => setActiveTab('animal')}
          >
            Back to In Vivo Animal Calculator
          </button>
        </div>
      )}
    </div>
  );
}
