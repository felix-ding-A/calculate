import React, { useState, useEffect } from 'react';
import { HelpCircle, RefreshCw, Zap, Percent, Scale, Clipboard } from 'lucide-react';
import { PRESET_INGREDIENTS } from '../utils/formulaParser';
import { IU_FACTORS } from '../utils/supplementData';

const MASS_UNITS = [
  { label: 'pg', factor: 1e-9 },
  { label: 'ng', factor: 1e-6 },
  { label: 'μg', factor: 1e-3 },
  { label: 'mg', factor: 1 },
  { label: 'g', factor: 1e3 },
  { label: 'kg', factor: 1e6 },
];

const CONC_UNITS = [
  { label: 'fM', factor: 1e-12 },
  { label: 'pM', factor: 1e-9 },
  { label: 'nM', factor: 1e-6 },
  { label: 'μM', factor: 1e-3 },
  { label: 'mM', factor: 1 },
  { label: 'M', factor: 1e3 },
];

const VOL_UNITS = [
  { label: 'nL', factor: 1e-6 },
  { label: 'μL', factor: 1e-3 },
  { label: 'mL', factor: 1 },
  { label: 'L', factor: 1e3 },
];

export default function MolarityCalculator() {
  const [calcMode, setCalcMode] = useState<'molarity' | 'percentage'>('molarity');

  // ==========================================
  // STATE: MOLARITY MODE
  // ==========================================
  const [mass, setMass] = useState<string>('88.06');
  const [massUnit, setMassUnit] = useState<string>('mg');
  const [conc, setConc] = useState<string>('50');
  const [concUnit, setConcUnit] = useState<string>('mM');
  const [volume, setVolume] = useState<string>('10');
  const [volumeUnit, setVolumeUnit] = useState<string>('mL');
  const [mw, setMw] = useState<string>('176.12'); // Default to Vitamin C MW
  const [target, setTarget] = useState<'mass' | 'conc' | 'volume' | 'mw'>('mass');
  const [formulaString, setFormulaString] = useState<string>('');
  const [molarityError, setMolarityError] = useState<string>('');

  // ==========================================
  // STATE: PERCENTAGE MODE (% w/w, % v/v)
  // ==========================================
  const [pctType, setPctType] = useState<'ww' | 'vv'>('ww');
  const [pctSolute, setPctSolute] = useState<string>('5');
  const [pctSoluteUnit, setPctSoluteUnit] = useState<string>('g');
  const [pctTotal, setPctTotal] = useState<string>('100');
  const [pctTotalUnit, setPctTotalUnit] = useState<string>('g');
  const [pctValue, setPctValue] = useState<string>('5');
  const [pctTarget, setPctTarget] = useState<'solute' | 'total' | 'pct'>('pct');
  const [pctFormulaString, setPctFormulaString] = useState<string>('');
  const [pctError, setPctError] = useState<string>('');

  // ==========================================
  // STATE: IU ↔ MG CONVERTER
  // ==========================================
  const [iuActiveKey, setIuActiveKey] = useState<string>('vitA');
  const [iuValue, setIuValue] = useState<string>('5000');
  const [mgValue, setMgValue] = useState<string>('1.5');

  // Auto trigger molarity calculation
  useEffect(() => {
    if (calcMode === 'molarity') {
      calculateMolarity();
    }
  }, [mass, massUnit, conc, concUnit, volume, volumeUnit, mw, target, calcMode]);

  // Auto trigger percentage calculation
  useEffect(() => {
    if (calcMode === 'percentage') {
      calculatePercentage();
    }
  }, [pctType, pctSolute, pctSoluteUnit, pctTotal, pctTotalUnit, pctValue, pctTarget, calcMode]);

  // Auto trigger IU converter
  useEffect(() => {
    convertIuToMg(iuValue);
  }, [iuActiveKey]);

  // Molarity calculations
  const calculateMolarity = () => {
    setMolarityError('');
    const mVal = parseFloat(mass);
    const cVal = parseFloat(conc);
    const vVal = parseFloat(volume);
    const mwVal = parseFloat(mw);

    try {
      if (target === 'mass') {
        if (isNaN(cVal) || isNaN(vVal) || isNaN(mwVal)) return;
        if (cVal <= 0 || vVal <= 0 || mwVal <= 0) throw new Error('Concentration, Volume, and Molecular Weight must be greater than 0');
        const C_SI = cVal * getSIFactor('conc', concUnit);
        const V_SI = vVal * getSIFactor('volume', volumeUnit);
        const mass_g = C_SI * V_SI * mwVal;
        const mass_target = mass_g / getSIFactor('mass', massUnit);
        setMass(formatResult(mass_target));
        setFormulaString(`Mass = Concentration × Volume × MW = ${cVal} ${concUnit} × ${vVal} ${volumeUnit} × ${mwVal} g/mol`);
      }
      else if (target === 'conc') {
        if (isNaN(mVal) || isNaN(vVal) || isNaN(mwVal)) return;
        if (mVal <= 0 || vVal <= 0 || mwVal <= 0) throw new Error('Mass, Volume, and Molecular Weight must be greater than 0');
        const mass_g = mVal * getSIFactor('mass', massUnit);
        const V_SI = vVal * getSIFactor('volume', volumeUnit);
        const conc_M = mass_g / (V_SI * mwVal);
        const conc_target = conc_M / getSIFactor('conc', concUnit);
        setConc(formatResult(conc_target));
        setFormulaString(`Concentration = Mass / (Volume × MW) = ${mVal} ${massUnit} / (${vVal} ${volumeUnit} × ${mwVal} g/mol)`);
      }
      else if (target === 'volume') {
        if (isNaN(mVal) || isNaN(cVal) || isNaN(mwVal)) return;
        if (mVal <= 0 || cVal <= 0 || mwVal <= 0) throw new Error('Mass, Concentration, and Molecular Weight must be greater than 0');
        const mass_g = mVal * getSIFactor('mass', massUnit);
        const C_SI = cVal * getSIFactor('conc', concUnit);
        const volume_L = mass_g / (C_SI * mwVal);
        const volume_target = volume_L / getSIFactor('volume', volumeUnit);
        setVolume(formatResult(volume_target));
        setFormulaString(`Volume = Mass / (Concentration × MW) = ${mVal} ${massUnit} / (${cVal} ${concUnit} × ${mwVal} g/mol)`);
      }
      else if (target === 'mw') {
        if (isNaN(mVal) || isNaN(cVal) || isNaN(vVal)) return;
        if (mVal <= 0 || cVal <= 0 || vVal <= 0) throw new Error('Mass, Concentration, and Volume must be greater than 0');
        const mass_g = mVal * getSIFactor('mass', massUnit);
        const C_SI = cVal * getSIFactor('conc', concUnit);
        const V_SI = vVal * getSIFactor('volume', volumeUnit);
        const mw_calc = mass_g / (C_SI * V_SI);
        setMw(formatResult(mw_calc));
        setFormulaString(`Molecular Weight = Mass / (Concentration × Volume) = ${mVal} ${massUnit} / (${cVal} ${concUnit} × ${vVal} ${volumeUnit})`);
      }
    } catch (e: any) {
      setMolarityError(e.message);
    }
  };

  // Percentage calculations
  const calculatePercentage = () => {
    setPctError('');
    const soluteVal = parseFloat(pctSolute);
    const totalVal = parseFloat(pctTotal);
    const pctVal = parseFloat(pctValue);

    try {
      const getUnitFactor = (unit: string) => {
        if (unit === 'pg') return 1e-12;
        if (unit === 'ng') return 1e-9;
        if (unit === 'μg') return 1e-6;
        if (unit === 'mg') return 1e-3;
        if (unit === 'g' || unit === 'mL') return 1.0;
        if (unit === 'kg' || unit === 'L') return 1e3;
        return 1.0;
      };

      const soluteBase = soluteVal * getUnitFactor(pctSoluteUnit);
      const totalBase = totalVal * getUnitFactor(pctTotalUnit);

      if (pctTarget === 'pct') {
        if (isNaN(soluteVal) || isNaN(totalVal)) return;
        if (soluteVal <= 0 || totalVal <= 0) throw new Error('Solute amount and Total amount must be greater than 0');
        if (soluteBase > totalBase) throw new Error('Solute amount cannot exceed total amount');

        const calculatedPct = (soluteBase / totalBase) * 100;
        setPctValue(formatResult(calculatedPct));
        
        const labelStr = pctType === 'ww' ? 'w/w' : 'v/v';
        setPctFormulaString(`Percentage (% ${labelStr}) = (Solute / Total) × 100% = (${soluteVal} ${pctSoluteUnit} / ${totalVal} ${pctTotalUnit}) × 100%`);
      }
      else if (pctTarget === 'solute') {
        if (isNaN(totalVal) || isNaN(pctVal)) return;
        if (totalVal <= 0 || pctVal <= 0 || pctVal > 100) throw new Error('Total amount must be > 0, and Percentage must be between 0% and 100%');

        const calculatedSoluteBase = totalBase * (pctVal / 100);
        const calculatedSolute = calculatedSoluteBase / getUnitFactor(pctSoluteUnit);
        setPctSolute(formatResult(calculatedSolute));
        
        setPctFormulaString(`Solute Amount = Total × (Percentage / 100) = ${totalVal} ${pctTotalUnit} × (${pctVal}% / 100)`);
      }
      else if (pctTarget === 'total') {
        if (isNaN(soluteVal) || isNaN(pctVal)) return;
        if (soluteVal <= 0 || pctVal <= 0 || pctVal > 100) throw new Error('Solute amount must be > 0, and Percentage must be between 0% and 100%');

        const calculatedTotalBase = soluteBase / (pctVal / 100);
        const calculatedTotal = calculatedTotalBase / getUnitFactor(pctTotalUnit);
        setPctTotal(formatResult(calculatedTotal));
        
        setPctFormulaString(`Total Amount = Solute / (Percentage / 100) = ${soluteVal} ${pctSoluteUnit} / (${pctVal}% / 100)`);
      }
    } catch (e: any) {
      setPctError(e.message);
    }
  };

  // IU ↔ Mg conversion functions
  const convertIuToMg = (val: string) => {
    setIuValue(val);
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      setMgValue('');
      return;
    }
    const factor = IU_FACTORS[iuActiveKey].iuToMg;
    const calculatedMg = num * factor;
    setMgValue(calculatedMg.toString());
  };

  const convertMgToIu = (val: string) => {
    setMgValue(val);
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      setIuValue('');
      return;
    }
    const factor = IU_FACTORS[iuActiveKey].mgToIu;
    const calculatedIu = Math.round(num * factor);
    setIuValue(calculatedIu.toString());
  };

  const applyConvertedMg = () => {
    if (!mgValue) return;
    if (calcMode === 'molarity') {
      setMass(mgValue);
      setMassUnit('mg');
      if (target === 'mass') {
        setTarget('conc'); // Prevent overwriting calculated result
      }
    } else {
      setPctSolute(mgValue);
      setPctSoluteUnit('g');
      if (pctTarget === 'solute') {
        setPctTarget('pct');
      }
    }
  };

  const getSIFactor = (type: 'mass' | 'conc' | 'volume', unit: string): number => {
    if (type === 'mass') {
      const u = MASS_UNITS.find(x => x.label === unit);
      return u ? u.factor / 1e3 : 1.0; // Standardize to grams in calculations
    } else if (type === 'conc') {
      const u = CONC_UNITS.find(x => x.label === unit);
      return u ? u.factor / 1e3 : 1.0; // Standardize to M
    } else if (type === 'volume') {
      const u = VOL_UNITS.find(x => x.label === unit);
      return u ? u.factor / 1e3 : 1.0; // Standardize to L
    }
    return 1.0;
  };

  const formatResult = (num: number): string => {
    if (num === 0) return '0';
    if (num < 1e-4 || num > 1e6) {
      return num.toExponential(4);
    }
    return parseFloat(num.toFixed(4)).toString();
  };

  const loadPreset = (preset: typeof PRESET_INGREDIENTS[0]) => {
    setMw(preset.mw.toString());
    if (target === 'mw') {
      setTarget('mass');
    }
  };

  const handleReset = () => {
    if (calcMode === 'molarity') {
      setMass('88.06');
      setMassUnit('mg');
      setConc('50');
      setConcUnit('mM');
      setVolume('10');
      setVolumeUnit('mL');
      setMw('176.12');
      setTarget('mass');
      setMolarityError('');
    } else {
      setPctType('ww');
      setPctSolute('5');
      setPctSoluteUnit('g');
      setPctTotal('100');
      setPctTotalUnit('g');
      setPctValue('5');
      setPctTarget('pct');
      setPctError('');
    }
  };

  const currentIuItem = IU_FACTORS[iuActiveKey];

  return (
    <div className="calculator-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="glow-title" style={{ fontSize: '28px', textAlign: 'left' }}>Molarity & Percentage</h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '14px', textAlign: 'left', marginTop: '4px' }}>
            Solve for Molarity parameters or Weight/Volume percentage configurations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="tabs-container">
            <button className={`tab-btn ${calcMode === 'molarity' ? 'active' : ''}`} onClick={() => setCalcMode('molarity')}>
              Molarity Mode (M)
            </button>
            <button className={`tab-btn ${calcMode === 'percentage' ? 'active' : ''}`} onClick={() => setCalcMode('percentage')}>
              Percentage Mode (%)
            </button>
          </div>
          <button className="btn btn-glass" onClick={handleReset}>
            <RefreshCw size={16} /> Reset
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* LEFT COLUMN: ACTIVE CALCULATOR CARD */}
        <div>
          {calcMode === 'molarity' ? (
            /* MOLARITY MAIN FORM */
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {molarityError && <div className="alert-glass alert-glass-danger">{molarityError}</div>}

              {/* Target Parameter Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-secondary)' }}>Target:</span>
                <div className="tabs-container">
                  <button className={`tab-btn ${target === 'mass' ? 'active' : ''}`} onClick={() => setTarget('mass')}>Solute Mass (m)</button>
                  <button className={`tab-btn ${target === 'conc' ? 'active' : ''}`} onClick={() => setTarget('conc')}>Concentration (C)</button>
                  <button className={`tab-btn ${target === 'volume' ? 'active' : ''}`} onClick={() => setTarget('volume')}>Volume (V)</button>
                  <button className={`tab-btn ${target === 'mw' ? 'active' : ''}`} onClick={() => setTarget('mw')}>Mol. Weight (M)</button>
                </div>
              </div>

              {/* 2x2 Parameter Inputs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Parameter: Mass */}
                <div className={`param-card ${target === 'mass' ? 'target-active' : ''}`} style={paramCardStyle(target === 'mass')}>
                  <label className="label-glass">Solute Mass (m)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      className="input-glass input-glass-mono"
                      value={mass}
                      onChange={(e) => setMass(e.target.value)}
                      disabled={target === 'mass'}
                      placeholder="Calculated..."
                    />
                    <select
                      className="input-glass select-glass"
                      style={{ width: '100px' }}
                      value={massUnit}
                      onChange={(e) => setMassUnit(e.target.value)}
                    >
                      {MASS_UNITS.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Parameter: Concentration */}
                <div className={`param-card ${target === 'conc' ? 'target-active' : ''}`} style={paramCardStyle(target === 'conc')}>
                  <label className="label-glass">Concentration (C)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      className="input-glass input-glass-mono"
                      value={conc}
                      onChange={(e) => setConc(e.target.value)}
                      disabled={target === 'conc'}
                      placeholder="Calculated..."
                    />
                    <select
                      className="input-glass select-glass"
                      style={{ width: '100px' }}
                      value={concUnit}
                      onChange={(e) => setConcUnit(e.target.value)}
                    >
                      {CONC_UNITS.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Parameter: Volume */}
                <div className={`param-card ${target === 'volume' ? 'target-active' : ''}`} style={paramCardStyle(target === 'volume')}>
                  <label className="label-glass">Volume (V)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      className="input-glass input-glass-mono"
                      value={volume}
                      onChange={(e) => setVolume(e.target.value)}
                      disabled={target === 'volume'}
                      placeholder="Calculated..."
                    />
                    <select
                      className="input-glass select-glass"
                      style={{ width: '100px' }}
                      value={volumeUnit}
                      onChange={(e) => setVolumeUnit(e.target.value)}
                    >
                      {VOL_UNITS.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Parameter: MW */}
                <div className={`param-card ${target === 'mw' ? 'target-active' : ''}`} style={paramCardStyle(target === 'mw')}>
                  <label className="label-glass">Mol. Weight (M)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      className="input-glass input-glass-mono"
                      value={mw}
                      onChange={(e) => setMw(e.target.value)}
                      disabled={target === 'mw'}
                      placeholder="Enter molecular weight..."
                    />
                    <span className="input-glass" style={{ width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', fontSize: '13px', color: 'var(--color-secondary)' }}>
                      g/mol
                    </span>
                  </div>
                </div>
              </div>

              {/* Molarity Details & Formulas */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '10px' }}>
                <span className="label-glass" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={14} /> Calculation Details & Formulas
                </span>
                <div className="input-glass-mono" style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', fontSize: '13px', color: 'var(--color-primary)', border: '1px solid rgba(255,255,255,0.03)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span>Base Formula: <strong style={{ color: 'var(--neon-cyan)' }}>m = C × V × M</strong></span>
                    <span style={{ opacity: 0.5 }}>|</span>
                    <span>Derived: 
                      {target === 'mass' && <strong style={{ color: 'var(--neon-cyan)' }}> m = C × V × M</strong>}
                      {target === 'conc' && <strong style={{ color: 'var(--neon-cyan)' }}> C = m / (V × M)</strong>}
                      {target === 'volume' && <strong style={{ color: 'var(--neon-cyan)' }}> V = m / (C × M)</strong>}
                      {target === 'mw' && <strong style={{ color: 'var(--neon-cyan)' }}> M = m / (C × V)</strong>}
                    </span>
                  </div>
                  <div style={{ color: 'var(--neon-cyan)', fontSize: '14px' }}>
                    {formulaString}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PERCENTAGE MAIN FORM */
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {pctError && <div className="alert-glass alert-glass-danger">{pctError}</div>}

              {/* Configuration Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-secondary)' }}>Type:</span>
                  <div className="tabs-container">
                    <button className={`tab-btn ${pctType === 'ww' ? 'active' : ''}`} onClick={() => setPctType('ww')}>Weight Ratio (w/w)</button>
                    <button className={`tab-btn ${pctType === 'vv' ? 'active' : ''}`} onClick={() => setPctType('vv')}>Volume Ratio (v/v)</button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-secondary)' }}>Solve For:</span>
                  <div className="tabs-container">
                    <button className={`tab-btn ${pctTarget === 'solute' ? 'active' : ''}`} onClick={() => setPctTarget('solute')}>Solute</button>
                    <button className={`tab-btn ${pctTarget === 'total' ? 'active' : ''}`} onClick={() => setPctTarget('total')}>Total</button>
                    <button className={`tab-btn ${pctTarget === 'pct' ? 'active' : ''}`} onClick={() => setPctTarget('pct')}>Percent (%)</button>
                  </div>
                </div>
              </div>

              {/* Percentage Inputs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Parameter: Solute Amount */}
                <div className={`param-card ${pctTarget === 'solute' ? 'target-active' : ''}`} style={paramCardStyle(pctTarget === 'solute')}>
                  <label className="label-glass">Solute {pctType === 'ww' ? 'Mass' : 'Volume'}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      className="input-glass input-glass-mono"
                      value={pctSolute}
                      onChange={(e) => setPctSolute(e.target.value)}
                      disabled={pctTarget === 'solute'}
                      placeholder="Calculated..."
                    />
                    <select
                      className="input-glass select-glass"
                      style={{ width: '100px' }}
                      value={pctSoluteUnit}
                      onChange={(e) => setPctSoluteUnit(e.target.value)}
                    >
                      {pctType === 'ww' 
                        ? ['ug', 'mg', 'g', 'kg'].map(u => <option key={u} value={u === 'ug' ? 'μg' : u}>{u === 'ug' ? 'μg' : u}</option>)
                        : ['uL', 'mL', 'L'].map(u => <option key={u} value={u === 'uL' ? 'μL' : u}>{u === 'uL' ? 'μL' : u}</option>)
                      }
                    </select>
                  </div>
                </div>

                {/* Parameter: Total Amount */}
                <div className={`param-card ${pctTarget === 'total' ? 'target-active' : ''}`} style={paramCardStyle(pctTarget === 'total')}>
                  <label className="label-glass">Total Solution {pctType === 'ww' ? 'Weight' : 'Volume'}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      className="input-glass input-glass-mono"
                      value={pctTotal}
                      onChange={(e) => setPctTotal(e.target.value)}
                      disabled={pctTarget === 'total'}
                      placeholder="Calculated..."
                    />
                    <select
                      className="input-glass select-glass"
                      style={{ width: '100px' }}
                      value={pctTotalUnit}
                      onChange={(e) => setPctTotalUnit(e.target.value)}
                    >
                      {pctType === 'ww' 
                        ? ['mg', 'g', 'kg'].map(u => <option key={u} value={u}>{u}</option>)
                        : ['mL', 'L'].map(u => <option key={u} value={u}>{u}</option>)
                      }
                    </select>
                  </div>
                </div>

                {/* Parameter: Percentage value */}
                <div className={`param-card ${pctTarget === 'pct' ? 'target-active' : ''}`} style={{ ...paramCardStyle(pctTarget === 'pct'), gridColumn: 'span 2' }}>
                  <label className="label-glass">Percentage Ratio (%)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      className="input-glass input-glass-mono"
                      value={pctValue}
                      onChange={(e) => setPctValue(e.target.value)}
                      disabled={pctTarget === 'pct'}
                      placeholder="Calculated..."
                    />
                    <span className="input-glass" style={{ width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', fontSize: '14px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Percentage Details & Formulas */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '10px' }}>
                <span className="label-glass" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Percent size={14} /> Calculation Details & Formulas
                </span>
                <div className="input-glass-mono" style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', fontSize: '13px', color: 'var(--color-primary)', border: '1px solid rgba(255,255,255,0.03)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                  <div style={{ color: 'var(--neon-cyan)', fontSize: '14px' }}>
                    {pctFormulaString}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: UTILITY SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* TOOL 1: IU ↔ MG CONVERTER CARD */}
          <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glow-title">
              <Scale size={16} style={{ color: 'var(--neon-emerald)' }} /> IU ↔ mg Converter
            </h3>
            
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              {Object.keys(IU_FACTORS).map(k => (
                <button
                  key={k}
                  onClick={() => setIuActiveKey(k)}
                  style={{
                    flex: 1,
                    fontSize: '11px',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    background: iuActiveKey === k ? 'rgba(5,243,162,0.1)' : 'transparent',
                    color: iuActiveKey === k ? 'var(--neon-emerald)' : 'var(--color-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: iuActiveKey === k ? 'bold' : 'normal',
                    transition: 'all 0.2s'
                  }}
                >
                  {k.replace('vit', 'Vit ')}
                </button>
              ))}
            </div>

            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontStyle: 'italic' }}>
              {currentIuItem.nameCn}
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label className="label-glass" style={{ fontSize: '10px' }}>International Units (IU)</label>
                <input
                  type="number"
                  className="input-glass input-glass-mono"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                  value={iuValue}
                  onChange={(e) => convertIuToMg(e.target.value)}
                  placeholder="Enter IU..."
                />
              </div>
              <div>
                <label className="label-glass" style={{ fontSize: '10px' }}>Equivalent Mass (mg)</label>
                <input
                  type="number"
                  className="input-glass input-glass-mono"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                  value={mgValue}
                  onChange={(e) => convertMgToIu(e.target.value)}
                  placeholder="Enter mg..."
                />
              </div>
            </div>

            <button
              className="btn btn-glass"
              style={{ fontSize: '11px', padding: '6px 10px', color: 'var(--neon-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={applyConvertedMg}
              disabled={!mgValue}
            >
              <Clipboard size={12} /> Apply to Active Form
            </button>
          </div>

          {/* TOOL 2: COMMON PRESETS */}
          <div className="glass-panel custom-scrollbar" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glow-title">
              <Zap size={16} /> Presets MW
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {PRESET_INGREDIENTS.map(p => (
                <div
                  key={p.nameEn}
                  onClick={() => loadPreset(p)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-glass)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all var(--transition-fast)'
                  }}
                  className="glass-panel-hover"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: '500', fontSize: '11px' }}>{p.nameEn.split(' ')[0]}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontSize: '11px' }}>{p.mw}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--color-muted)' }}>
                    <span>{p.formula}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
