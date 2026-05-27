import { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertCircle, Grid, Info, Tag } from 'lucide-react';
import { parseFormula, PRESET_INGREDIENTS, ATOMIC_WEIGHTS } from '../utils/formulaParser';

export default function MolecularWeightCalculator() {
  const [formula, setFormula] = useState<string>('C10H16N2O2');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [mwResult, setMwResult] = useState<ReturnType<typeof parseFormula> | null>(null);

  useEffect(() => {
    setMwResult(parseFormula(formula));
  }, [formula]);

  const handleKeyPress = (char: string) => {
    setFormula(prev => prev + char);
  };

  const handleBackspace = () => {
    setFormula(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setFormula('');
  };

  // Search by English Name, Chinese Name, or Chemical Formula
  const filteredPresets = PRESET_INGREDIENTS.filter(
    p => p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) || 
         p.nameCn.toLowerCase().includes(searchTerm.toLowerCase()) || 
         p.formula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Automatically find if the typed formula matches any database preset
  const matchedPreset = PRESET_INGREDIENTS.find(
    p => p.formula.replace(/\s+/g, '') === formula.replace(/\s+/g, '')
  );

  // Calculate element weight percentages for breakdown
  const getWeightBreakdown = () => {
    if (!mwResult || mwResult.error || mwResult.molecularWeight === 0) return [];
    
    const breakdown = Object.entries(mwResult.composition).map(([element, count]) => {
      const atomInfo = ATOMIC_WEIGHTS[element];
      const atomW = atomInfo?.weight || 0;
      const subtotal = atomW * count;
      const percentage = (subtotal / mwResult.molecularWeight) * 100;
      
      return {
        element,
        nameCn: atomInfo?.nameCn || 'Unknown',
        nameEn: atomInfo?.nameEn || 'Unknown',
        count,
        atomicWeight: atomW,
        subtotal: parseFloat(subtotal.toFixed(4)),
        percentage: parseFloat(percentage.toFixed(2))
      };
    });

    // Sort by percentage descending
    return breakdown.sort((a, b) => b.percentage - a.percentage);
  };

  const breakdown = getWeightBreakdown();

  return (
    <div className="calculator-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="glow-title" style={{ fontSize: '28px', textAlign: 'left' }}>Molecular Weight Calculator</h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '14px', textAlign: 'left', marginTop: '4px' }}>
            Parse complex chemical formulas (hydrates, nested brackets) and analyze element weight percentages
          </p>
        </div>
        <button className="btn btn-glass" onClick={() => setFormula('C10H16N2O2')}>
          <RefreshCw size={16} /> Reset
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left main area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Formula Input Panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="label-glass">Enter Chemical Formula</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input-glass input-glass-mono"
                  style={{ fontSize: '20px', padding: '12px 16px' }}
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  placeholder="e.g. Ca(OH)2 or CuSO4·5H2O"
                />
              </div>
            </div>

            {/* Virtual chemical keyboard (very useful in labs) */}
            <div>
              <span className="label-glass" style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                Laboratory Virtual Keyboard (for touchscreens or glove operations)
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['C', 'H', 'O', 'N', 'P', 'S', 'Na', 'Cl', 'K', 'Ca', 'Mg', 'Fe', 'Cu', 'Zn', '(', ')', '·', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(char => (
                  <button
                    key={char}
                    onClick={() => handleKeyPress(char)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--color-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      minWidth: '40px'
                    }}
                    className="glass-panel-hover"
                  >
                    {char}
                  </button>
                ))}
                <button
                  onClick={handleBackspace}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,78,106,0.08)',
                    border: '1px solid rgba(255,78,106,0.2)',
                    color: 'var(--neon-rose)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    minWidth: '60px'
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleClear}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--color-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    minWidth: '60px'
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Results Analysis Panel */}
          {mwResult && (
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {mwResult.error ? (
                <div className="alert-glass alert-glass-danger" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} />
                  <div>
                    <strong>Formula parsing failed:</strong> {mwResult.error}
                  </div>
                </div>
              ) : (
                <>
                  {/* Molecular Weight Display */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
                    <div>
                      <span className="label-glass" style={{ marginBottom: '4px' }}>Parsed Formula</span>
                      <strong style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>{mwResult.formula}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="label-glass" style={{ marginBottom: '4px' }}>Calculated Molecular Weight</span>
                      <strong style={{ fontSize: '32px', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', textShadow: '0 0 15px rgba(0, 242, 254, 0.4)' }}>
                        {mwResult.molecularWeight} <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--color-secondary)' }}>g/mol</span>
                      </strong>
                    </div>
                  </div>

                  {/* Matched Ingredient Card (Enhanced search context) */}
                  {matchedPreset && (
                    <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(5, 243, 162, 0.03)', border: '1px solid rgba(5, 243, 162, 0.15)', display: 'flex', gap: '12px' }}>
                      <Info size={20} style={{ color: 'var(--neon-emerald)', flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ color: 'var(--color-primary)' }}>{matchedPreset.nameCn}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>({matchedPreset.nameEn})</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', color: 'var(--color-secondary)' }}>
                            <Tag size={10} /> {matchedPreset.type}
                          </span>
                        </div>
                        <span style={{ color: 'var(--color-secondary)', fontSize: '12px', lineHeight: '1.4' }}>
                          {matchedPreset.desc}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Element Breakdown Percentages */}
                  <div>
                    <h4 style={{ fontSize: '15px', color: 'var(--color-secondary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Grid size={15} /> Element Mass Percentage Breakdown
                    </h4>
                    
                    {/* Visual stacked bar chart */}
                    <div style={{ display: 'flex', height: '18px', width: '100%', borderRadius: '9px', overflow: 'hidden', marginBottom: '20px', background: 'rgba(255,255,255,0.05)' }}>
                      {breakdown.map((item, idx) => {
                        const colors = ['var(--neon-cyan)', 'var(--neon-violet)', 'var(--neon-emerald)', 'var(--neon-amber)', 'var(--neon-rose)', '#3b82f6', '#ec4899', '#6366f1'];
                        const col = colors[idx % colors.length];
                        return (
                          <div
                            key={item.element}
                            style={{
                              width: `${item.percentage}%`,
                              background: col,
                              height: '100%',
                              transition: 'all 0.3s ease-in-out'
                            }}
                            title={`${item.element} (${item.nameEn}): ${item.percentage}%`}
                          />
                        );
                      })}
                    </div>

                    {/* Breakdown details list */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {breakdown.map((item, idx) => {
                        const colors = ['var(--neon-cyan)', 'var(--neon-violet)', 'var(--neon-emerald)', 'var(--neon-amber)', 'var(--neon-rose)', '#3b82f6', '#ec4899', '#6366f1'];
                        const col = colors[idx % colors.length];
                        
                        return (
                          <div
                            key={item.element}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '12px',
                              background: 'rgba(255,255,255,0.01)',
                              border: '1px solid var(--border-glass)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: col }} />
                                <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '15px' }}>{item.element}</strong>
                                <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{item.nameEn}</span>
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 'bold', color: col }}>{item.percentage}%</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-secondary)' }}>
                              <span>Count: <strong style={{ fontFamily: 'var(--font-mono)' }}>{item.count}</strong></span>
                              <span>At. Wt: <strong style={{ fontFamily: 'var(--font-mono)' }}>{item.atomicWeight}</strong></span>
                              <span>Mass: <strong style={{ fontFamily: 'var(--font-mono)' }}>{item.subtotal}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Preset Search list */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', maxHeight: '550px' }}>
          <h3 style={{ fontSize: '16px' }} className="glow-title">Formula Database</h3>
          
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="input-glass"
              style={{ paddingLeft: '36px', fontSize: '13px' }}
              placeholder="Search name, formula, 中文名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
            {filteredPresets.length > 0 ? (
              filteredPresets.map(p => (
                <div
                  key={p.nameEn}
                  onClick={() => setFormula(p.formula)}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-glass)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all var(--transition-fast)'
                  }}
                  className="glass-panel-hover"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{p.nameCn}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-muted)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)' }}>{p.formula}</span>
                    <span>MW: {p.mw}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                    {p.nameEn}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: '12px', marginTop: '20px' }}>
                No matching data
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
