import React, { useState, useEffect } from 'react';
import { RefreshCw, HelpCircle, TrendingDown, Layers, FileText, Plus, Trash, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { REGULATORY_LIMITS } from '../utils/cosmeticData';

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

interface ScalingIngredient {
  id: string;
  name: string;
  percentage: string;
}

export default function DilutionCalculator() {
  const [activeTab, setActiveTab] = useState<'standard' | 'serial' | 'scaling'>('standard');

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
  const [totalVol, setTotalVol] = useState<string>('100');
  const [volUnit, setVolUnit] = useState<string>('μL');
  const [serialResults, setSerialResults] = useState<any[]>([]);

  // ==========================================
  // STATE: FORMULA SCALING
  // ==========================================
  const [scalingIngredients, setScalingIngredients] = useState<ScalingIngredient[]>([
    { id: '1', name: '去离子水 (Water)', percentage: '75' },
    { id: '2', name: '甘油 (Glycerin)', percentage: '10' },
    { id: '3', name: 'GTCC', percentage: '10' },
    { id: '4', name: '烟酰胺 (Niacinamide)', percentage: '4' },
    { id: '5', name: '苯氧乙醇 (Phenoxyethanol)', percentage: '1' }
  ]);
  const [baseBatchSize, setBaseBatchSize] = useState<string>('100');
  const [baseBatchUnit, setBaseBatchUnit] = useState<string>('g');
  const [targetBatchSize, setTargetBatchSize] = useState<string>('50');
  const [targetBatchUnit, setTargetBatchUnit] = useState<string>('kg');
  const [scalingWarnings, setScalingWarnings] = useState<string[]>([]);
  const [scalingTotalPct, setScalingTotalPct] = useState<number>(100);

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

  // Scaling calculations auto trigger
  useEffect(() => {
    if (activeTab === 'scaling') {
      calculateScaling();
    }
  }, [scalingIngredients, baseBatchSize, baseBatchUnit, targetBatchSize, targetBatchUnit, activeTab]);

  // Helper: Convert concentration to a common base of mg/mL (mass)
  const convertConcToBase = (value: number, unit: string, mwVal: number): number => {
    const unitInfo = CONC_UNITS.find(u => u.label === unit);
    if (!unitInfo) return value;
    if (unitInfo.type === 'molar') {
      const valM = value * unitInfo.factor;
      return valM * mwVal;
    } else {
      return value * unitInfo.factor;
    }
  };

  // Helper: Convert from common base (mg/mL) to target concentration unit
  const convertConcFromBase = (valueInBase: number, targetUnit: string, mwVal: number): number => {
    const unitInfo = CONC_UNITS.find(u => u.label === targetUnit);
    if (!unitInfo) return valueInBase;
    if (unitInfo.type === 'molar') {
      const valM = valueInBase / mwVal;
      return valM / unitInfo.factor;
    } else {
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
      setStdError('Valid Molecular Weight must be provided for cross-system concentration conversion.');
      return;
    }

    try {
      const fV1 = VOL_UNITS.find(u => u.label === v1Unit)?.factor || 1;
      const fV2 = VOL_UNITS.find(u => u.label === v2Unit)?.factor || 1;

      if (target === 'v1') {
        if (isNaN(c1Val) || isNaN(c2Val) || isNaN(v2Val)) return;
        if (c1Val <= 0 || c2Val <= 0 || v2Val <= 0) throw new Error('Concentration and Volume must be greater than 0');

        const c1Base = convertConcToBase(c1Val, c1Unit, mwVal);
        const c2Base = convertConcToBase(c2Val, c2Unit, mwVal);
        const v2L = v2Val * fV2;

        const v1L = (c2Base * v2L) / c1Base;
        const v1_target = v1L / fV1;

        if (v1_target > v2Val * (fV2 / fV1)) {
          throw new Error('Calculated initial volume (V₁) is greater than final volume (V₂). Dilution ratio is illogical.');
        }

        setV1(formatResult(v1_target));
        setStdFormula(`V₁ = (C₂ × V₂) / C₁ = (${c2Val} ${c2Unit} × ${v2Val} ${v2Unit}) / ${c1Val} ${c1Unit}`);
        
        const solvent_vol = (v2L - v1L) / fV2;
        setStdOperation(`Transfer ${formatResult(v1_target)} ${v1Unit} of initial solution into ${formatResult(solvent_vol)} ${v2Unit} of diluent.`);
      }
      else if (target === 'v2') {
        if (isNaN(c1Val) || isNaN(v1Val) || isNaN(c2Val)) return;
        if (c1Val <= 0 || v1Val <= 0 || c2Val <= 0) throw new Error('Concentration and Volume must be greater than 0');

        const c1Base = convertConcToBase(c1Val, c1Unit, mwVal);
        const c2Base = convertConcToBase(c2Val, c2Unit, mwVal);
        const v1L = v1Val * fV1;

        const v2L = (c1Base * v1L) / c2Base;
        const v2_target = v2L / fV2;

        if (v2_target < v1Val * (fV1 / fV2)) {
          throw new Error('Calculated final volume (V₂) is smaller than initial volume (V₁). No dilution needed.');
        }

        setV2(formatResult(v2_target));
        setStdFormula(`V₂ = (C₁ × V₁) / C₂ = (${c1Val} ${c1Unit} × ${v1Val} ${v1Unit}) / ${c2Val} ${c2Unit}`);
        
        const solvent_vol = (v2L - v1L) / fV2;
        setStdOperation(`Transfer ${v1Val} ${v1Unit} of initial solution into ${formatResult(solvent_vol)} ${v2Unit} of diluent (total volume: ${formatResult(v2_target)} ${v2Unit}).`);
      }
      else if (target === 'c1') {
        if (isNaN(v1Val) || isNaN(c2Val) || isNaN(v2Val)) return;
        if (v1Val <= 0 || c2Val <= 0 || v2Val <= 0) throw new Error('Concentration and Volume must be greater than 0');

        const c2Base = convertConcToBase(c2Val, c2Unit, mwVal);
        const v1L = v1Val * fV1;
        const v2L = v2Val * fV2;

        const c1Base = (c2Base * v2L) / v1L;
        const c1_target = convertConcFromBase(c1Base, c1Unit, mwVal);

        setC1(formatResult(c1_target));
        setStdFormula(`C₁ = (C₂ × V₂) / V₁ = (${c2Val} ${c2Unit} × ${v2Val} ${v2Unit}) / ${v1Val} ${v1Unit}`);
        setStdOperation(`Use stock solution with concentration of ${formatResult(c1_target)} ${c1Unit}.`);
      }
      else if (target === 'c2') {
        if (isNaN(c1Val) || isNaN(v1Val) || isNaN(v2Val)) return;
        if (c1Val <= 0 || v1Val <= 0 || v2Val <= 0) throw new Error('Concentration and Volume must be greater than 0');

        const c1Base = convertConcToBase(c1Val, c1Unit, mwVal);
        const v1L = v1Val * fV1;
        const v2L = v2Val * fV2;

        const c2Base = (c1Base * v1L) / v2L;
        const c2_target = convertConcFromBase(c2Base, c2Unit, mwVal);

        setC2(formatResult(c2_target));
        setStdFormula(`C₂ = (C₁ × V₁) / V₂ = (${c1Val} ${c1Unit} × ${v1Val} ${v1Unit}) / ${v2Val} ${v2Unit}`);
        
        const solvent_vol = (v2L - v1L) / fV2;
        setStdOperation(`The final solution concentration will be ${formatResult(c2_target)} ${c2Unit}. Operation: Mix ${v1Val} ${v1Unit} of initial solution into ${formatResult(solvent_vol)} ${v2Unit} of diluent.`);
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
          ? `Pipette ${formatResult(transferVol)} ${volUnit} of stock (C0) into Tube 1 containing ${formatResult(solventVol)} ${volUnit} of diluent and mix.`
          : `Pipette ${formatResult(transferVol)} ${volUnit} of preceding (C${i-1}) into Tube ${i} containing ${formatResult(solventVol)} ${volUnit} of diluent and mix.`
      });
    }
    setSerialResults(results);
  };

  // Formula Scaling logic & Regulatory Limits verification
  const calculateScaling = () => {
    const warnings: string[] = [];
    let totalPctSum = 0;

    scalingIngredients.forEach(ing => {
      const pct = parseFloat(ing.percentage) || 0;
      totalPctSum += pct;

      // Regulation limit check (Case-insensitive matching)
      const ingNameLower = ing.name.toLowerCase();
      const matchedLimitKey = Object.keys(REGULATORY_LIMITS).find(
        key => ingNameLower.includes(key.toLowerCase()) || ingNameLower.includes(REGULATORY_LIMITS[key].nameCn.toLowerCase())
      );

      if (matchedLimitKey) {
        const limitInfo = REGULATORY_LIMITS[matchedLimitKey];
        if (pct > limitInfo.maxUsagePct) {
          warnings.push(`【法规安全警告】成分 [${ing.name}] 百分比为 ${pct}%, 超过国家/欧盟安全限制最大浓度 ${limitInfo.maxUsagePct}% (${limitInfo.ref})。`);
        }
      }
    });

    setScalingTotalPct(parseFloat(totalPctSum.toFixed(2)));
    setScalingWarnings(warnings);
  };

  const getWeightInGram = (value: number, unit: string): number => {
    return unit === 'kg' ? value * 1000 : value;
  };

  const formatWeight = (valueInGram: number, targetUnit: string): string => {
    if (targetUnit === 'kg') {
      const valKg = valueInGram / 1000;
      return `${valKg.toFixed(4).replace(/\.?0+$/, '')} kg`;
    }
    return `${valueInGram.toFixed(3).replace(/\.?0+$/, '')} g`;
  };

  // Scaling list CRUD helpers
  const addScalingIngredient = () => {
    const nextId = (Math.max(...scalingIngredients.map(i => parseInt(i.id) || 0)) + 1).toString();
    setScalingIngredients([...scalingIngredients, { id: nextId, name: '新原料成分', percentage: '0' }]);
  };

  const updateScalingIngredient = (id: string, field: 'name' | 'percentage', value: string) => {
    setScalingIngredients(
      scalingIngredients.map(ing => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  const removeScalingIngredient = (id: string) => {
    setScalingIngredients(scalingIngredients.filter(ing => ing.id !== id));
  };

  const loadScalingPreset = (presetName: 'serum' | 'cream') => {
    if (presetName === 'serum') {
      setScalingIngredients([
        { id: '1', name: '去离子水 (Water)', percentage: '86.35' },
        { id: '2', name: '甘油 (Glycerin)', percentage: '5.0' },
        { id: '3', name: '丁二醇 (Butylene Glycol)', percentage: '3.0' },
        { id: '4', name: '烟酰胺 (Niacinamide)', percentage: '4.0' },
        { id: '5', name: '苯氧乙醇 (Phenoxyethanol)', percentage: '1.5' }, // deliberately triggers phenoxyethanol warning
        { id: '6', name: '透明质酸钠 (Sodium Hyaluronate)', percentage: '0.15' }
      ]);
    } else {
      setScalingIngredients([
        { id: '1', name: '去离子水 (Water)', percentage: '67.8' },
        { id: '2', name: 'GTCC (润肤油)', percentage: '15.0' },
        { id: '3', name: '鲸蜡硬脂醇 (乳化剂)', percentage: '5.0' },
        { id: '4', name: '甘油 (保湿)', percentage: '5.0' },
        { id: '5', name: '烟酰胺 (活性成分)', percentage: '6.0' }, // deliberately triggers niacinamide warning
        { id: '6', name: '苯氧乙醇 (防腐剂)', percentage: '0.8' },
        { id: '7', name: '尿囊素 (舒缓)', percentage: '0.4' }
      ]);
    }
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

  const baseBatchVal = parseFloat(baseBatchSize) || 0;
  const targetBatchVal = parseFloat(targetBatchSize) || 0;
  const scalingRatio = baseBatchVal > 0 ? getWeightInGram(targetBatchVal, targetBatchUnit) / getWeightInGram(baseBatchVal, baseBatchUnit) : 1;

  const paramCardStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '16px',
    borderRadius: '12px',
    background: isActive ? 'rgba(0, 242, 254, 0.04)' : 'rgba(255, 255, 255, 0.01)',
    border: isActive ? '1px solid rgba(0, 242, 254, 0.25)' : '1px solid var(--border-glass)',
    boxShadow: isActive ? '0 0 15px rgba(0, 242, 254, 0.05)' : 'none',
    transition: 'all 0.2s ease-in-out'
  });

  return (
    <div className="calculator-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="glow-title" style={{ fontSize: '28px', textAlign: 'left' }}>Dilution & Scaling</h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '14px', textAlign: 'left', marginTop: '4px' }}>
            Calculate standard dilutions (C₁V₁ = C₂V₂), continuous serial gradients, or upscale/downscale active formulations
          </p>
        </div>
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'standard' ? 'active' : ''}`} onClick={() => setActiveTab('standard')}>
            <Layers size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Standard Dilution
          </button>
          <button className={`tab-btn ${activeTab === 'serial' ? 'active' : ''}`} onClick={() => setActiveTab('serial')}>
            <TrendingDown size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Serial Dilution
          </button>
          <button className={`tab-btn ${activeTab === 'scaling' ? 'active' : ''}`} onClick={() => setActiveTab('scaling')}>
            <FileText size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Formula Scaling & safety check
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
              <span style={{ fontSize: '14px', color: 'var(--color-secondary)' }}>Target:</span>
              <div className="tabs-container">
                <button className={`tab-btn ${target === 'v1' ? 'active' : ''}`} onClick={() => setTarget('v1')}>Sample Vol (V₁)</button>
                <button className={`tab-btn ${target === 'v2' ? 'active' : ''}`} onClick={() => setTarget('v2')}>Final Vol (V₂)</button>
                <button className={`tab-btn ${target === 'c1' ? 'active' : ''}`} onClick={() => setTarget('c1')}>Initial Conc (C₁)</button>
                <button className={`tab-btn ${target === 'c2' ? 'active' : ''}`} onClick={() => setTarget('c2')}>Final Conc (C₂)</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={paramCardStyle(target === 'c1')}>
                <label className="label-glass">Initial Conc (C₁)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    value={c1}
                    onChange={(e) => setC1(e.target.value)}
                    disabled={target === 'c1'}
                    placeholder="Calculated..."
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

              <div style={paramCardStyle(target === 'v1')}>
                <label className="label-glass">Sample Vol (V₁)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    value={v1}
                    onChange={(e) => setV1(e.target.value)}
                    disabled={target === 'v1'}
                    placeholder="Calculated..."
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

              <div style={paramCardStyle(target === 'c2')}>
                <label className="label-glass">Final Conc (C₂)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    value={c2}
                    onChange={(e) => setC2(e.target.value)}
                    disabled={target === 'c2'}
                    placeholder="Calculated..."
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

              <div style={paramCardStyle(target === 'v2')}>
                <label className="label-glass">Final Vol (V₂)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    value={v2}
                    onChange={(e) => setV2(e.target.value)}
                    disabled={target === 'v2'}
                    placeholder="Calculated..."
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

            {isMixedSystemActive() && (
              <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(161,84,255,0.05)', border: '1px solid rgba(161,84,255,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>
                  Cross-system dilution detected. Solute molecular weight (MW) is required:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    style={{ width: '120px', padding: '6px 10px' }}
                    value={mw}
                    onChange={(e) => setMw(e.target.value)}
                    placeholder="MW..."
                  />
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>g/mol</span>
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '10px' }}>
              <span className="label-glass" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={14} /> Formula & Derivation
              </span>
              <div className="input-glass-mono" style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ color: 'var(--neon-cyan)', fontSize: '14px', marginBottom: '4px' }}>
                  {stdFormula}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glow-title">
              <FileText size={16} /> Dilution Instructions
            </h3>
            {stdOperation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', fontSize: '14px', lineHeight: '1.6', color: 'var(--color-primary)' }}>
                  {stdOperation}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>* Note: Use calibrated micropipettes for handling microliter volumes.</span>
                  <span>* Vortex thoroughly after mixing to ensure a homogeneous solution.</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Enter parameters to generate instructions...</p>
            )}
            <button className="btn btn-glass" style={{ marginTop: 'auto' }} onClick={handleResetStd}>
              <RefreshCw size={14} /> Reset Panel
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: SERIAL DILUTION
          ========================================== */}
      {activeTab === 'serial' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '16px' }} className="glow-title">Serial Dilution Settings</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="label-glass">Stock Concentration (C₀)</label>
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

              <div>
                <label className="label-glass">Dilution Factor (e.g. 10 for 1:10)</label>
                <input
                  type="number"
                  className="input-glass input-glass-mono"
                  value={dilutionFactor}
                  onChange={(e) => setDilutionFactor(e.target.value)}
                  placeholder="e.g. 10, 2, 5"
                />
              </div>

              <div>
                <label className="label-glass">Volume per Tube (V_total)</label>
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

              <div>
                <label className="label-glass">Dilution Steps (2 - 12)</label>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '250px' }} className="custom-scrollbar">
              <span className="label-glass">Serial Dilution Steps Checklist</span>
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
                    <strong style={{ color: 'var(--neon-cyan)', fontSize: '13px' }}>{r.step} Tube</strong>
                    <div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{r.concentration} {c0Unit}</span>
                      <span style={{ color: 'var(--color-muted)', fontSize: '11px', marginLeft: '8px' }}>Log: {r.logConc}</span>
                    </div>
                  </div>
                  <div style={{ color: 'var(--color-secondary)' }}>{r.operation}</div>
                </div>
              ))}
            </div>

            <button className="btn btn-glass" style={{ alignSelf: 'flex-start' }} onClick={handleResetSerial}>
              <RefreshCw size={14} /> Reset Parameters
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glow-title">
              <TrendingDown size={16} /> Semi-Log Dilution Curve (Log₁₀ C vs Step)
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
                  Enter valid parameters to plot the curve
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: FORMULA SCALING & SAFE ALARMS
          ========================================== */}
      {activeTab === 'scaling' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Left Area: Ingredient table editor */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px' }} className="glow-title">Formula Component Editor</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-glass" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => loadScalingPreset('serum')}>Load Serum Template</button>
                <button className="btn btn-glass" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => loadScalingPreset('cream')}>Load Cream Template</button>
              </div>
            </div>

            {/* Scale Configuration input */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '10px' }}>
              <div>
                <label className="label-glass" style={{ fontSize: '11px' }}>Base Batch size</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                    value={baseBatchSize}
                    onChange={(e) => setBaseBatchSize(e.target.value)}
                  />
                  <select
                    className="input-glass select-glass"
                    style={{ width: '80px', padding: '6px' }}
                    value={baseBatchUnit}
                    onChange={(e) => setBaseBatchUnit(e.target.value)}
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-glass" style={{ fontSize: '11px' }}>Target Batch size (Upscaled/Downscaled)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                    value={targetBatchSize}
                    onChange={(e) => setTargetBatchSize(e.target.value)}
                  />
                  <select
                    className="input-glass select-glass"
                    style={{ width: '80px', padding: '6px' }}
                    value={targetBatchUnit}
                    onChange={(e) => setTargetBatchUnit(e.target.value)}
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List editor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '300px' }} className="custom-scrollbar">
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 40px', gap: '10px', padding: '0 8px', fontSize: '11px', color: 'var(--color-muted)' }}>
                <span>Ingredient Component Name</span>
                <span>Percentage (%)</span>
                <span>Action</span>
              </div>

              {scalingIngredients.map(ing => (
                <div key={ing.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 40px', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="input-glass"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    value={ing.name}
                    onChange={(e) => updateScalingIngredient(ing.id, 'name', e.target.value)}
                    placeholder="e.g. Phenoxyethanol"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      className="input-glass input-glass-mono"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      value={ing.percentage}
                      onChange={(e) => updateScalingIngredient(ing.id, 'percentage', e.target.value)}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>%</span>
                  </div>
                  <button
                    onClick={() => removeScalingIngredient(ing.id)}
                    style={{
                      background: 'rgba(255,78,106,0.1)',
                      border: '1px solid rgba(255,78,106,0.2)',
                      borderRadius: '8px',
                      color: 'var(--neon-rose)',
                      cursor: 'pointer',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>
                Total Percentage: {' '}
                <strong style={{ color: Math.abs(scalingTotalPct - 100) > 0.01 ? 'var(--neon-rose)' : 'var(--neon-emerald)' }}>
                  {scalingTotalPct}%
                </strong>
                {Math.abs(scalingTotalPct - 100) > 0.01 && ' (Must sum to exactly 100%)'}
              </div>
              <button className="btn btn-glass" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={addScalingIngredient}>
                <Plus size={14} /> Add Ingredient
              </button>
            </div>
          </div>

          {/* Right Area: Scaling report & alarms */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glow-title">
              <CheckCircle size={16} /> Batch Scaling & Regulatory Report
            </h3>

            {scalingWarnings.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {scalingWarnings.map((w, idx) => (
                  <div key={idx} className="alert-glass alert-glass-danger" style={{ fontSize: '11px', padding: '8px 10px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {scalingWarnings.length === 0 && Math.abs(scalingTotalPct - 100) <= 0.01 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'rgba(5,243,162,0.05)', border: '1px solid rgba(5,243,162,0.2)', borderRadius: '10px', color: 'var(--neon-emerald)', fontSize: '12px' }}>
                <CheckCircle size={14} />
                <span>All ingredients are within regulatory safety limits. Formulation verified.</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', maxHeight: '350px' }} className="custom-scrollbar">
              <span className="label-glass">Material Take-off List (Takeoff Sheet)</span>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <th style={{ padding: '8px 4px', color: 'var(--color-muted)' }}>Name</th>
                    <th style={{ padding: '8px 4px', color: 'var(--color-muted)', textAlign: 'right' }}>Ratio (%)</th>
                    <th style={{ padding: '8px 4px', color: 'var(--color-muted)', textAlign: 'right' }}>Base ({baseBatchSize}{baseBatchUnit})</th>
                    <th style={{ padding: '8px 4px', textAlign: 'right', color: 'var(--neon-cyan)' }}>Target ({targetBatchSize}{targetBatchUnit})</th>
                  </tr>
                </thead>
                <tbody>
                  {scalingIngredients.map(ing => {
                    const pct = parseFloat(ing.percentage) || 0;
                    const baseG = getWeightInGram(pct, 'g') * (baseBatchVal / 100);
                    const targetG = baseG * scalingRatio;

                    return (
                      <tr key={ing.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '8px 4px', fontWeight: '500' }}>{ing.name}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{pct}%</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatWeight(baseG, baseBatchUnit)}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--neon-cyan)' }}>{formatWeight(targetG, targetBatchUnit)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', fontSize: '11px', color: 'var(--color-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span>* Scaling Factor: {scalingRatio.toFixed(4).replace(/\.?0+$/, '')}x</span>
              <span>* Regulatory database includes updates for CFDA (2015) and IFRA 49th amendments limits.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
