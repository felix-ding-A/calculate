import React, { useState } from 'react';
import { FlaskConical, Layers, TrendingDown, BookOpen, Calculator } from 'lucide-react';
import MolarityCalculator from './components/MolarityCalculator';
import DilutionCalculator from './components/DilutionCalculator';
import MolecularWeightCalculator from './components/MolecularWeightCalculator';
import FormulaCalculator from './components/FormulaCalculator';

type CalculatorType = 'molarity' | 'dilution' | 'mw' | 'formula';

export default function App() {
  const [activeCalc, setActiveCalc] = useState<CalculatorType>('molarity');

  const renderCalculator = () => {
    switch (activeCalc) {
      case 'molarity':
        return <MolarityCalculator />;
      case 'dilution':
        return <DilutionCalculator />;
      case 'mw':
        return <MolecularWeightCalculator />;
      case 'formula':
        return <FormulaCalculator />;
      default:
        return <MolarityCalculator />;
    }
  };

  return (
    <>
      {/* Dynamic neon ambient glow */}
      <div className="ambient-bg">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
      </div>

      <div className="app-container">
        {/* Left Sidebar Navigation */}
        <aside className="glass-panel" style={sidebarStyle}>
          {/* Logo Section */}
          <div style={logoContainerStyle}>
            <div style={logoIconWrapperStyle}>
              <FlaskConical size={22} style={{ color: 'var(--neon-cyan)' }} />
            </div>
            <div style={logoTextStyle}>
              <h1 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px', margin: 0 }} className="glow-title">
                Pure Formulator
              </h1>
              <span style={{ fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Formulation Engine v1.0
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav style={navStyle}>
            <span style={menuLabelStyle}>Calculators List</span>
            
            <button
              onClick={() => setActiveCalc('molarity')}
              style={navItemStyle(activeCalc === 'molarity', 'cyan')}
              className="glass-panel-hover"
            >
              <Layers size={18} style={{ color: activeCalc === 'molarity' ? 'var(--neon-cyan)' : 'var(--color-secondary)' }} />
              <div style={navTextContainer}>
                <span style={navTitleStyle(activeCalc === 'molarity')}>Molarity Calculator</span>
                <span style={navSubtitleStyle}>Mass - Vol - Conc Solver</span>
              </div>
            </button>

            <button
              onClick={() => setActiveCalc('dilution')}
              style={navItemStyle(activeCalc === 'dilution', 'violet')}
              className="glass-panel-hover"
            >
              <TrendingDown size={18} style={{ color: activeCalc === 'dilution' ? 'var(--neon-violet)' : 'var(--color-secondary)' }} />
              <div style={navTextContainer}>
                <span style={navTitleStyle(activeCalc === 'dilution')}>Dilution Calculator</span>
                <span style={navSubtitleStyle}>C1V1 & Serial Dilution</span>
              </div>
            </button>

            <button
              onClick={() => setActiveCalc('mw')}
              style={navItemStyle(activeCalc === 'mw', 'emerald')}
              className="glass-panel-hover"
            >
              <Calculator size={18} style={{ color: activeCalc === 'mw' ? 'var(--neon-emerald)' : 'var(--color-secondary)' }} />
              <div style={navTextContainer}>
                <span style={navTitleStyle(activeCalc === 'mw')}>Molecular Weight</span>
                <span style={navSubtitleStyle}>Formula Parser & Analyzer</span>
              </div>
            </button>

            <button
              onClick={() => setActiveCalc('formula')}
              style={navItemStyle(activeCalc === 'formula', 'rose')}
              className="glass-panel-hover"
            >
              <FlaskConical size={18} style={{ color: activeCalc === 'formula' ? 'var(--neon-rose)' : 'var(--color-secondary)' }} />
              <div style={navTextContainer}>
                <span style={navTitleStyle(activeCalc === 'formula')}>Formulation SOP</span>
                <span style={navSubtitleStyle}>Multi-Solvent & SOP Guide</span>
              </div>
            </button>
          </nav>

          {/* Bottom Footer Info & Help */}
          <div style={sidebarFooterStyle}>
            <div style={docLinkStyle} className="glass-panel-hover">
              <BookOpen size={14} style={{ color: 'var(--color-secondary)' }} />
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{ color: 'var(--color-secondary)', textDecoration: 'none', fontSize: '12px' }}
              >
                Documentation & Help
              </a>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-muted)', textAlign: 'center', marginTop: '10px' }}>
              © 2026 Pure Formulator. All rights reserved.
            </p>
          </div>
        </aside>

        {/* Right Main Calculator Area */}
        <main className="glass-panel custom-scrollbar" style={mainAreaStyle}>
          {renderCalculator()}
        </main>
      </div>
    </>
  );
}

/* ==========================================================================
   STYLES DEFINITIONS (PURE JS/CSS INTERACTION)
   ========================================================================== */

const sidebarStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 16px',
  height: '100%',
  gap: '24px',
};

const logoContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  borderBottom: '1px solid var(--border-glass)',
  paddingBottom: '18px',
};

const logoIconWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '38px',
  height: '38px',
  borderRadius: '12px',
  background: 'rgba(0, 242, 254, 0.1)',
  border: '1px solid rgba(0, 242, 254, 0.2)',
  boxShadow: '0 0 10px rgba(0, 242, 254, 0.15)',
};

const logoTextStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  flex: 1,
};

const menuLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '600',
  color: 'var(--color-muted)',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '4px',
  paddingLeft: '8px',
};

const navItemStyle = (isActive: boolean, activeColor: 'cyan' | 'violet' | 'emerald' | 'rose'): React.CSSProperties => {
  const colorMap = {
    cyan: { bg: 'rgba(0, 242, 254, 0.06)', border: '1px solid rgba(0, 242, 254, 0.2)', glow: '0 0 10px rgba(0, 242, 254, 0.05)' },
    violet: { bg: 'rgba(161, 84, 255, 0.06)', border: '1px solid rgba(161, 84, 255, 0.2)', glow: '0 0 10px rgba(161, 84, 255, 0.05)' },
    emerald: { bg: 'rgba(5, 243, 162, 0.06)', border: '1px solid rgba(5, 243, 162, 0.2)', glow: '0 0 10px rgba(5, 243, 162, 0.05)' },
    rose: { bg: 'rgba(255, 78, 106, 0.06)', border: '1px solid rgba(255, 78, 106, 0.2)', glow: '0 0 10px rgba(255, 78, 106, 0.05)' },
  };

  const style = colorMap[activeColor];

  return {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '12px',
    background: isActive ? style.bg : 'rgba(255, 255, 255, 0.01)',
    border: isActive ? style.border : '1px solid transparent',
    boxShadow: isActive ? style.glow : 'none',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    width: '100%',
  };
};

const navTextContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',
};

const navTitleStyle = (isActive: boolean): React.CSSProperties => ({
  fontSize: '14px',
  fontWeight: '600',
  color: isActive ? 'var(--color-primary)' : 'var(--color-secondary)',
  transition: 'color 0.2s ease',
});

const navSubtitleStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-muted)',
};

const sidebarFooterStyle: React.CSSProperties = {
  borderTop: '1px solid var(--border-glass)',
  paddingTop: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const docLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '8px',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid var(--border-glass)',
  transition: 'all 0.2s ease',
};

const mainAreaStyle: React.CSSProperties = {
  padding: '24px',
  overflowY: 'auto',
  height: '100%',
};
