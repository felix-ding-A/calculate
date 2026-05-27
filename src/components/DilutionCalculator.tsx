import React, { useState, useEffect } from 'react';
import { RefreshCw, HelpCircle, TrendingDown, Layers, FileText } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const CONC_UNITS = [
  { label: 'pM', type: 'molar', factor: 1e-12 },
  { label: 'nM', type: 'molar', factor: 1e-9 },
  { label: 'μM', type: 'molar', factor: 1e-6 },
  { label: 'mM', type: 'molar', factor: 1e-3 },
  { label: 'M', type: 'molar', factor: 1.0 },
  { label: 'μg/mL', type: 'mass', factor: 1e-3 },
  { label: 'mg/mL', type: 'mass', factor: 1.0 },
  { label: 'g/L', type: 'mass', factor: 1.0 },
  { label: '% (w/v)', type: 'percent', factor: 10.0 }, // 1% = 10 mg/mL
];

const VOL_UNITS = [
  { label: 'nL', factor: 1e-9 },
  { label: 'μL', factor: 1e-6 },
  { label: 'mL', factor: 1e-3 },
  { label: 'L', factor: 1.0 },
];

export default function DilutionCalculator() {
  const [activeTab, setActiveTab] = useState<'standard' | 'serial'>('standard');

  // ==========================================
  // STATE: STANDARD DILUTION
  // ==========================================
  const [c1, setC1] = useState<string>('10');
  const [c1Unit, setC1Unit] = useState<string>('mM');
  const [v1, setV1] = useState<string>('');
  const [v1Unit, setV1Unit] = useState<string>('μL');
  const [c2, setC2] = useState<string>('100');
  const [c2Unit, setC2Unit] = useState<string>('μM');
  const [v2, setV2] = useState<string>('1');
  const [v2Unit, setV2Unit] = useState<string>('mL');
  
  const [mw, setMw] = useState<string>('176.12'); // Used when converting between molar and mass concentrations
  const [target, setTarget] = useState<'c1' | 'v1' | 'c2' | 'v2'>('v1');
  const [stdFormula, setStdFormula] = useState<string>('');
  const [stdOperation, setStdOperation] = useState<string>('');
  const [stdError, setStdError] = useState<string>('');

  // ==========================================
  // STATE: SERIAL DILUTION
  // ==========================================
  const [c0, setC0] = useState<string>('10');
  const [c0Unit, setC0Unit] = useState<string>('mM');
  const [dilutionFactor, setDilutionFactor] = useState<string>('10');
  const [steps, setSteps] = useState<number>(8);
  const [totalVol, setTotalVol] = useState<string>('100'); // Total volume of dilution desired in each tube
  const [volUnit, setVolUnit] = useState<string>('μL');
  const [serialResults, setSerialResults] = useState<any[]>([]);

  // Standard dilution auto trigger
  useEffect(() => {
    if (activeTab === 'standard') {
      calculateStandard();
    }
  }, [c1, c1Unit, v1, v1Unit, c2, c2Unit, v2, v2Unit, target, mw, activeTab]);

  // Serial dilution auto trigger
  useEffect(() => {
    if (activeTab === 'serial') {
      calculateSerial();
    }
  }, [c0, c0Unit, dilutionFactor, steps, totalVol, volUnit, activeTab]);

  // Helper: Convert concentration to a common base of mg/mL (mass)
  // If unit is molar, we require MW.
  const convertConcToBase = (value: number, unit: string, mwVal: number): number => {
    const unitInfo = CONC_UNITS.find(u => u.label === unit);
    if (!unitInfo) return value;

    if (unitInfo.type === 'molar') {
      // Molar to mg/mL: Value (M) * MW (g/mol) = g/L = mg/mL.
      // So value * factor (M) * MW = mg/mL.
      const valM = value * unitInfo.factor;
      return valM * mwVal;
    } else {
      // Mass or percent: factor is relative to mg/mL
      return value * unitInfo.factor;
    }
  };

  // Helper: Convert from common base (mg/mL) to target concentration unit
  const convertConcFromBase = (valueInBase: number, targetUnit: string, mwVal: number): number => {
    const unitInfo = CONC_UNITS.find(u => u.label === targetUnit);
    if (!unitInfo) return valueInBase;

    if (unitInfo.type === 'molar') {
      // mg/mL to Molar: mg/mL = g/L. g/L / MW = M.
      // So valueInBase / MW = M.
      // Convert M to target unit: M / factor = unit value.
      const valM = valueInBase / mwVal;
      return valM / unitInfo.factor;
    } else {
      // Mass or percent
      return valueInBase / unitInfo.factor;
    }
  };

  // Standard calculation logic
  const calculateStandard = () => {
    setStdError('');
    const c1Val = parseFloat(c1);
    const v1Val = parseFloat(v1);
    const c2Val = parseFloat(c2);
    const v2Val = parseFloat(v2);
    const mwVal = parseFloat(mw) || 176.12;

    const uC1 = CONC_UNITS.find(u => u.label === c1Unit);
    const uC2 = CONC_UNITS.find(u => u.label === c2Unit);
    const isMixedSystem = uC1 && uC2 && (uC1.type !== uC2.type);

    if (isMixedSystem && (!mwVal || isNaN(mwVal) || mwVal <= 0)) {
      setStdError('进行摩尔浓度与质量浓度跨系统换算时，必须输入有效的分子量');
      return;
    }

    try {
      // Volume factors (to L)
      const fV1 = VOL_UNITS.find(u => u.label === v1Unit)?.factor || 1;
      const fV2 = VOL_UNITS.find(u => u.label === v2Unit)?.factor || 1;

      if (target === 'v1') {
        if (isNaN(c1Val) || isNaN(c2Val) || isNaN(v2Val)) return;
        if (c1Val <= 0 || c2Val <= 0 || v2Val <= 0) throw new Error('浓度和体积必须大于 0');

        const c1Base = convertConcToBase(c1Val, c1Unit, mwVal);
        const c2Base = convertConcToBase(c2Val, c2Unit, mwVal);
        const v2L = v2Val * fV2;

        // C1 * V1 = C2 * V2 -> V1 = C2 * V2 / C1
        const v1L = (c2Base * v2L) / c1Base;
        const v1_target = v1L / fV1;

        if (v1_target > v2Val * (fV2 / fV1)) {
          throw new Error('计算所得初始体积(V1)大于目标体积(V2)，稀释比例不合逻辑，请检查浓度设定');
        }

        setV1(formatResult(v1_target));
        setStdFormula(`V₁ = (C₂ × V₂) / C₁ = (${c2Val} ${c2Unit} × ${v2Val} ${v2Unit}) / ${c1Val} ${c1Unit}`);
        
        // Practical Operation Guide
        const v1_display = formatResult(v1_target);
        const solvent_vol = (v2L - v1L) / fV2;
        setStdOperation(`量取 ${v1_display} ${v1Unit} 初始溶液，加入 ${formatResult(solvent_vol)} ${v2Unit} 稀释溶剂中，混匀即可配制出 ${v2Val} ${v2Unit} 的目标溶液。`);
      }
      else if (target === 'v2') {
        if (isNaN(c1Val) || isNaN(v1Val) || isNaN(c2Val)) return;
        if (c1Val <= 0 || v1Val <= 0 || c2Val <= 0) throw new Error('浓度和体积必须大于 0');

        const c1Base = convertConcToBase(c1Val, c1Unit, mwVal);
        const c2Base = convertConcToBase(c2Val, c2Unit, mwVal);
        const v1L = v1Val * fV1;

        // V2 = C1 * V1 / C2
        const v2L = (c1Base * v1L) / c2Base;
        const v2_target = v2L / fV2;

        if (v2_target < v1Val * (fV1 / fV2)) {
          throw new Error('计算所得目标体积(V2)小于初始体积(V1)，无需稀释，请检查浓度设定');
        }

        setV2(formatResult(v2_target));
        setStdFormula(`V₂ = (C₁ × V₁) / C₂ = (${c1Val} ${c1Unit} × ${v1Val} ${v1Unit}) / ${c2Val} ${c2Unit}`);
        
        const solvent_vol = (v2L - v1L) / fV2;
        setStdOperation(`量取 ${v1Val} ${v1Unit} 初始溶液，加入 ${formatResult(solvent_vol)} ${v2Unit} 稀释溶剂（使总体积达到 ${formatResult(v2_target)} ${v2Unit}），即可配制完成。`);
      }
      else if (target === 'c1') {
        if (isNaN(v1Val) || isNaN(c2Val) || isNaN(v2Val)) return;
        if (v1Val <= 0 || c2Val <= 0 || v2Val <= 0) throw new Error('浓度和体积必须大于 0');

        const c2Base = convertConcToBase(c2Val, c2Unit, mwVal);
        const v1L = v1Val * fV1;
        const v2L = v2Val * fV2;

        // C1 = C2 * V2 / V1
        const c1Base = (c2Base * v2L) / v1L;
        const c1_target = convertConcFromBase(c1Base, c1Unit, mwVal);

        setC1(formatResult(c1_target));
        setStdFormula(`C₁ = (C₂ × V₂) / V₁ = (${c2Val} ${c2Unit} × ${v2Val} ${v2Unit}) / ${v1Val} ${v1Unit}`);
        setStdOperation(`需使用浓度为 ${formatResult(c1_target)} ${c1Unit} 的初始母液进行本配方配制。`);
      }
      else if (target === 'c2') {
        if (isNaN(c1Val) || isNaN(v1Val) || isNaN(v2Val)) return;
        if (c1Val <= 0 || v1Val <= 0 || v2Val <= 0) throw new Error('浓度和体积必须大于 0');

        const c1Base = convertConcToBase(c1Val, c1Unit, mwVal);
        const v1L = v1Val * fV1;
        const v2L = v2Val * fV2;

        // C2 = C1 * V1 / V2
        const c2Base = (c1Base * v1L) / v2L;
        const c2_target = convertConcFromBase(c2Base, c2Unit, mwVal);

        setC2(formatResult(c2_target));
        setStdFormula(`C₂ = (C₁ × V₁) / V₂ = (${c1Val} ${c1Unit} × ${v1Val} ${v1Unit}) / ${v2Val} ${v2Unit}`);
        
        const solvent_vol = (v2L - v1L) / fV2;
        setStdOperation(`配制完成后的目标溶液浓度为 ${formatResult(c2_target)} ${c2Unit}。操作过程：在 ${formatResult(solvent_vol)} ${v2Unit} 溶剂中混入 ${v1Val} ${v1Unit} 初始溶液。`);
      }
    } catch (e: any) {
      setStdError(e.message);
    }
  };

  // Serial dilution logic
  const calculateSerial = () => {
    const c0Val = parseFloat(c0);
    const factorVal = parseFloat(dilutionFactor);
    const totalVolVal = parseFloat(totalVol);

    if (isNaN(c0Val) || isNaN(factorVal) || isNaN(totalVolVal) || c0Val <= 0 || factorVal <= 1 || totalVolVal <= 0) {
      return;
    }

    const results = [];
    let currentConc = c0Val;

    // Calculation for transfer volume and solvent volume per tube:
    // Dilution Factor DF = (TransferVol + SolventVol) / TransferVol
    // DF = 1 + (SolventVol / TransferVol)
    // -> SolventVol / TransferVol = DF - 1
    // Given Total Volume Vt = TransferVol + SolventVol
    // -> TransferVol = Vt / DF
    // -> SolventVol = Vt - TransferVol = Vt * (DF - 1) / DF
    const transferVol = totalVolVal / factorVal;
    const solventVol = totalVolVal - transferVol;

    for (let i = 1; i <= steps; i++) {
      currentConc = currentConc / factorVal;
      const logVal = Math.log10(currentConc);
      
      results.push({
        step: `C${i}`,
        concentration: parseFloat(currentConc.toFixed(5)),
        logConc: parseFloat(logVal.toFixed(4)),
        operation: i === 1 
          ? `吸取 ${formatResult(transferVol)} ${volUnit} 母液(C0)，加入含有 ${formatResult(solventVol)} ${volUnit} 溶剂的1号管中混匀。`
          : `吸取 ${formatResult(transferVol)} ${volUnit} 上一级溶液(C${i-1})，加入含有 ${formatResult(solventVol)} ${volUnit} 溶剂的${i}号管中混匀。`
      });
    }
    setSerialResults(results);
  };

  const formatResult = (num: number): string => {
    if (num === 0) return '0';
    if (num < 1e-4 || num > 1e6) {
      return num.toExponential(4);
    }
    return parseFloat(num.toFixed(4)).toString();
  };

  const handleResetStd = () => {
    setC1('10');
    setC1Unit('mM');
    setV1('');
    setV1Unit('μL');
    setC2('100');
    setC2Unit('μM');
    setV2('1');
    setV2Unit('mL');
    setTarget('v1');
    setStdError('');
  };

  const handleResetSerial = () => {
    setC0('10');
    setC0Unit('mM');
    setDilutionFactor('10');
    setSteps(8);
    setTotalVol('100');
    setVolUnit('μL');
  };

  const isMixedSystemActive = () => {
    const uC1 = CONC_UNITS.find(u => u.label === c1Unit);
    const uC2 = CONC_UNITS.find(u => u.label === c2Unit);
    return uC1 && uC2 && (uC1.type !== uC2.type);
  };

  return (
    <div className="calculator-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="glow-title" style={{ fontSize: '28px', textAlign: 'left' }}>稀释计算器</h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '14px', textAlign: 'left', marginTop: '4px' }}>
            标准稀释配比与多梯度连续稀释方案生成
          </p>
        </div>
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'standard' ? 'active' : ''}`} onClick={() => setActiveTab('standard')}>
            <Layers size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> 标准稀释 (C₁V₁ = C₂V₂)
          </button>
          <button className={`tab-btn ${activeTab === 'serial' ? 'active' : ''}`} onClick={() => setActiveTab('serial')}>
            <TrendingDown size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> 连续梯度稀释
          </button>
        </div>
      </div>

      {/* ==========================================
          TAB 1: STANDARD DILUTION
          ========================================== */}
      {activeTab === 'standard' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {stdError && <div className="alert-glass alert-glass-danger">{stdError}</div>}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--color-secondary)' }}>求解目标:</span>
              <div className="tabs-container">
                <button className={`tab-btn ${target === 'v1' ? 'active' : ''}`} onClick={() => setTarget('v1')}>初始体积 (V₁)</button>
                <button className={`tab-btn ${target === 'v2' ? 'active' : ''}`} onClick={() => setTarget('v2')}>目标体积 (V₂)</button>
                <button className={`tab-btn ${target === 'c1' ? 'active' : ''}`} onClick={() => setTarget('c1')}>初始浓度 (C₁)</button>
                <button className={`tab-btn ${target === 'c2' ? 'active' : ''}`} onClick={() => setTarget('c2')}>目标浓度 (C₂)</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* C1 */}
              <div style={paramCardStyle(target === 'c1')}>
                <label className="label-glass">初始浓度 (C₁)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    value={c1}
                    onChange={(e) => setC1(e.target.value)}
                    disabled={target === 'c1'}
                    placeholder="计算所得..."
                  />
                  <select
                    className="input-glass select-glass"
                    style={{ width: '110px' }}
                    value={c1Unit}
                    onChange={(e) => setC1Unit(e.target.value)}
                  >
                    {CONC_UNITS.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
                  </select>
                </div>
              </div>

              {/* V1 */}
              <div style={paramCardStyle(target === 'v1')}>
                <label className="label-glass">需取体积 (V₁)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    value={v1}
                    onChange={(e) => setV1(e.target.value)}
                    disabled={target === 'v1'}
                    placeholder="计算所得..."
                  />
                  <select
                    className="input-glass select-glass"
                    style={{ width: '100px' }}
                    value={v1Unit}
                    onChange={(e) => setV1Unit(e.target.value)}
                  >
                    {VOL_UNITS.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
                  </select>
                </div>
              </div>

              {/* C2 */}
              <div style={paramCardStyle(target === 'c2')}>
                <label className="label-glass">目标浓度 (C₂)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    value={c2}
                    onChange={(e) => setC2(e.target.value)}
                    disabled={target === 'c2'}
                    placeholder="计算所得..."
                  />
                  <select
                    className="input-glass select-glass"
                    style={{ width: '110px' }}
                    value={c2Unit}
                    onChange={(e) => setC2Unit(e.target.value)}
                  >
                    {CONC_UNITS.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
                  </select>
                </div>
              </div>

              {/* V2 */}
              <div style={paramCardStyle(target === 'v2')}>
                <label className="label-glass">目标体积 (V₂)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    value={v2}
                    onChange={(e) => setV2(e.target.value)}
                    disabled={target === 'v2'}
                    placeholder="计算所得..."
                  />
                  <select
                    className="input-glass select-glass"
                    style={{ width: '100px' }}
                    value={v2Unit}
                    onChange={(e) => setV2Unit(e.target.value)}
                  >
                    {VOL_UNITS.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Optional MW input when cross-system conversion is active */}
            {isMixedSystemActive() && (
              <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(161,84,255,0.05)', border: '1px solid rgba(161,84,255,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>
                  检测到摩尔浓度与质量百分比跨体系稀释，需要提供溶质分子量进行换算：
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    style={{ width: '120px', padding: '6px 10px' }}
                    value={mw}
                    onChange={(e) => setMw(e.target.value)}
                    placeholder="分子量..."
                  />
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>g/mol</span>
                </div>
              </div>
            )}

            {/* Formula display */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '10px' }}>
              <span className="label-glass" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={14} /> 计算公式推导
              </span>
              <div className="input-glass-mono" style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ color: 'var(--neon-cyan)', fontSize: '14px', marginBottom: '4px' }}>
                  {stdFormula}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Operation card */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glow-title">
              <FileText size={16} /> 稀释操作说明书
            </h3>
            {stdOperation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', fontSize: '14px', lineHeight: '1.6', color: 'var(--color-primary)' }}>
                  {stdOperation}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>※ 注意：量取微小体积液体时，请使用校准过的微量移液枪。</span>
                  <span>※ 混合后请进行充分涡旋混匀，确保浓度均一。</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>请输入参数以生成操作指引...</p>
            )}
            <button className="btn btn-glass" style={{ marginTop: 'auto' }} onClick={handleResetStd}>
              <RefreshCw size={14} /> 重置本板
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: SERIAL DILUTION
          ========================================== */}
      {activeTab === 'serial' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left Config */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '16px' }} className="glow-title">梯度稀释参数设置</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* C0 */}
              <div>
                <label className="label-glass">母液初始浓度 (C₀)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    value={c0}
                    onChange={(e) => setC0(e.target.value)}
                  />
                  <select
                    className="input-glass select-glass"
                    style={{ width: '100px' }}
                    value={c0Unit}
                    onChange={(e) => setC0Unit(e.target.value)}
                  >
                    {CONC_UNITS.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Dilution Factor */}
              <div>
                <label className="label-glass">稀释倍数 (如: 10表示1:10稀释)</label>
                <input
                  type="number"
                  className="input-glass input-glass-mono"
                  value={dilutionFactor}
                  onChange={(e) => setDilutionFactor(e.target.value)}
                  placeholder="如: 10, 2, 5"
                />
              </div>

              {/* Tube volume desired */}
              <div>
                <label className="label-glass">单管稀释总体积 (V_total)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    value={totalVol}
                    onChange={(e) => setTotalVol(e.target.value)}
                  />
                  <select
                    className="input-glass select-glass"
                    style={{ width: '100px' }}
                    value={volUnit}
                    onChange={(e) => setVolUnit(e.target.value)}
                  >
                    {VOL_UNITS.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Steps count */}
              <div>
                <label className="label-glass">稀释梯度级数 (2 - 12)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    value={steps}
                    onChange={(e) => setSteps(parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--neon-cyan)' }}
                  />
                  <span className="input-glass input-glass-mono" style={{ width: '50px', textAlign: 'center', padding: '6px' }}>{steps}</span>
                </div>
              </div>
            </div>

            {/* Serial Results List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '250px' }} className="custom-scrollbar">
              <span className="label-glass">梯度稀释步骤清单</span>
              {serialResults.map((r) => (
                <div
                  key={r.step}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-glass)',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--neon-cyan)', fontSize: '13px' }}>{r.step} 梯度管</strong>
                    <div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{r.concentration} {c0Unit}</span>
                      <span style={{ color: 'var(--color-muted)', fontSize: '11px', marginLeft: '8px' }}>Log值: {r.logConc}</span>
                    </div>
                  </div>
                  <div style={{ color: 'var(--color-secondary)' }}>{r.operation}</div>
                </div>
              ))}
            </div>

            <button className="btn btn-glass" style={{ alignSelf: 'flex-start' }} onClick={handleResetSerial}>
              <RefreshCw size={14} /> 重置参数
            </button>
          </div>

          {/* Right Chart display */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glow-title">
              <TrendingDown size={16} /> 半对数稀释曲线 (Log₁₀ C vs Step)
            </h3>
            
            <div style={{ width: '100%', height: '320px', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', padding: '10px', border: '1px solid var(--border-glass)' }}>
              {serialResults.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serialResults} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="step" stroke="var(--color-secondary)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="var(--color-secondary)" style={{ fontSize: '12px' }} name="Log Concentration" />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(16, 16, 28, 0.9)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '8px',
                        color: 'var(--color-primary)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="logConc"
                      stroke="url(#lineGradient)"
                      strokeWidth={3}
                      dot={{ fill: 'var(--neon-cyan)', stroke: 'var(--bg-dark)', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: 'var(--neon-violet)' }}
                    />
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--neon-cyan)" />
                        <stop offset="100%" stopColor="var(--neon-violet)" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
                  请输入有效参数以绘制曲线图
                </div>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-secondary)', lineHeight: '1.5' }}>
              <strong>图表物理意义：</strong>
              <p style={{ marginTop: '2px' }}>
                在标准的生物及化学实验验证中，半对数坐标系（纵轴为浓度的以 10 为底的对数）能将呈指数衰减的梯度浓度拟合为一条笔直的线性下降轨迹。这极其方便绘制 ELISA 标准曲线或评估功效成分的 IC₅₀（半抑制浓度）区间。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const paramCardStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '16px',
  borderRadius: '12px',
  background: isActive ? 'rgba(0, 242, 254, 0.04)' : 'rgba(255, 255, 255, 0.01)',
  border: isActive ? '1px solid rgba(0, 242, 254, 0.25)' : '1px solid var(--border-glass)',
  boxShadow: isActive ? '0 0 15px rgba(0, 242, 254, 0.05)' : 'none',
  transition: 'all 0.2s ease-in-out'
});
