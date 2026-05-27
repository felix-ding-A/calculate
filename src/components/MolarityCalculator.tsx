import React, { useState, useEffect } from 'react';
import { HelpCircle, RefreshCw, Zap } from 'lucide-react';
import { PRESET_INGREDIENTS } from '../utils/formulaParser';

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
  const [mass, setMass] = useState<string>('88.06');
  const [massUnit, setMassUnit] = useState<string>('mg');
  const [conc, setConc] = useState<string>('50');
  const [concUnit, setConcUnit] = useState<string>('mM');
  const [volume, setVolume] = useState<string>('10');
  const [volumeUnit, setVolumeUnit] = useState<string>('mL');
  const [mw, setMw] = useState<string>('176.12'); // Default to Vitamin C MW
  
  const [target, setTarget] = useState<'mass' | 'conc' | 'volume' | 'mw'>('mass');
  const [formulaString, setFormulaString] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Auto trigger calculation whenever inputs change
  useEffect(() => {
    calculate();
  }, [mass, massUnit, conc, concUnit, volume, volumeUnit, mw, target]);

  const calculate = () => {
    setError('');
    
    // Parse numeric values
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
        
        // Convert mass_g to target unit
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
      setError(e.message);
    }
  };

  const getSIFactor = (type: 'mass' | 'conc' | 'volume', unit: string): number => {
    if (type === 'mass') {
      switch (unit) {
        case 'pg': return 1e-12;
        case 'ng': return 1e-9;
        case 'μg': return 1e-6;
        case 'mg': return 1e-3;
        case 'g':  return 1.0;
        case 'kg': return 1e3;
      }
    } else if (type === 'conc') {
      switch (unit) {
        case 'fM': return 1e-15;
        case 'pM': return 1e-12;
        case 'nM': return 1e-9;
        case 'μM': return 1e-6;
        case 'mM': return 1e-3;
        case 'M':  return 1.0;
      }
    } else if (type === 'volume') {
      switch (unit) {
        case 'nL': return 1e-9;
        case 'μL': return 1e-6;
        case 'mL': return 1e-3;
        case 'L':  return 1.0;
      }
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
    // Trigger recalculation with the new MW
    if (target === 'mw') {
      setTarget('mass');
    }
  };

  const handleReset = () => {
    setMass('88.06');
    setMassUnit('mg');
    setConc('50');
    setConcUnit('mM');
    setVolume('10');
    setVolumeUnit('mL');
    setMw('176.12');
    setTarget('mass');
    setError('');
  };

  return (
    <div className="calculator-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="glow-title" style={{ fontSize: '28px', textAlign: 'left' }}>Molarity Calculator</h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '14px', textAlign: 'left', marginTop: '4px' }}>
            Solve for Mass, Concentration, Volume, or Molecular Weight with automated scale conversion
          </p>
        </div>
        <button className="btn btn-glass" onClick={handleReset}>
          <RefreshCw size={16} /> Reset
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left Form */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && <div className="alert-glass alert-glass-danger">{error}</div>}

          {/* Mode Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-secondary)' }}>Target:</span>
            <div className="tabs-container">
              <button className={`tab-btn ${target === 'mass' ? 'active' : ''}`} onClick={() => setTarget('mass')}>Solute Mass (m)</button>
              <button className={`tab-btn ${target === 'conc' ? 'active' : ''}`} onClick={() => setTarget('conc')}>Concentration (C)</button>
              <button className={`tab-btn ${target === 'volume' ? 'active' : ''}`} onClick={() => setTarget('volume')}>Volume (V)</button>
              <button className={`tab-btn ${target === 'mw' ? 'active' : ''}`} onClick={() => setTarget('mw')}>Mol. Weight (M)</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Input Row: Mass */}
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

            {/* Input Row: Concentration */}
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

            {/* Input Row: Volume */}
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

            {/* Input Row: Molecular Weight */}
            <div className={`param-card ${target === 'mw' ? 'target-active' : ''}`} style={paramCardStyle(target === 'mw')}>
              <label className="label-glass">Mol. Weight (M)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  className="input-glass input-glass-mono"
                  value={mw}
                  onChange={(e) => setMw(e.target.value)}
                  disabled={target === 'mw'}
                  placeholder="Enter or select preset..."
                />
                <span className="input-glass" style={{ width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', fontSize: '13px', color: 'var(--color-secondary)' }}>
                  g/mol
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Formula Display */}
          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '10px' }}>
            <span className="label-glass" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={14} /> Calculation Details & Formulas
            </span>
            <div className="input-glass-mono" style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', fontSize: '13px', color: 'var(--color-primary)', border: '1px solid rgba(255,255,255,0.03)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span>Base Formula: <strong style={{ color: 'var(--neon-cyan)' }}>m = C × V × M</strong></span>
                <span style={{ opacity: 0.5 }}>|</span>
                <span>Derived Formula: 
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

        {/* Right Sidebar: Preset List */}
        <div className="glass-panel custom-scrollbar" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', maxHeight: '420px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glow-title">
            <Zap size={16} /> Common Presets
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>Click to load molecular weight:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PRESET_INGREDIENTS.map(p => (
              <div
                key={p.nameEn}
                onClick={() => loadPreset(p)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-glass)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all var(--transition-fast)'
                }}
                className="glass-panel-hover"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontWeight: '500' }}>{p.nameEn}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)' }}>{p.mw}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-muted)' }}>
                  <span>{p.formula}</span>
                  <span style={{ padding: '1px 4px', borderRadius: '4px', background: p.category === 'supplement' ? 'rgba(5,243,162,0.1)' : 'rgba(161,84,255,0.1)', color: p.category === 'supplement' ? 'var(--neon-emerald)' : 'var(--neon-violet)' }}>
                    {p.type}
                  </span>
                </div>
              </div>
            ))}
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
