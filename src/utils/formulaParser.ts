/**
 * 元素周期表原子量数据
 */
export const ATOMIC_WEIGHTS: Record<string, { weight: number; nameCn: string; nameEn: string }> = {
  'H':  { weight: 1.008,   nameCn: '氢', nameEn: 'Hydrogen' },
  'He': { weight: 4.0026,  nameCn: '氦', nameEn: 'Helium' },
  'Li': { weight: 6.94,    nameCn: '锂', nameEn: 'Lithium' },
  'Be': { weight: 9.0122,  nameCn: '铍', nameEn: 'Beryllium' },
  'B':  { weight: 10.81,   nameCn: '硼', nameEn: 'Boron' },
  'C':  { weight: 12.011,  nameCn: '碳', nameEn: 'Carbon' },
  'N':  { weight: 14.007,  nameCn: '氮', nameEn: 'Nitrogen' },
  'O':  { weight: 15.999,  nameCn: '氧', nameEn: 'Oxygen' },
  'F':  { weight: 18.998,  nameCn: '氟', nameEn: 'Fluorine' },
  'Ne': { weight: 20.180,  nameCn: '氖', nameEn: 'Neon' },
  'Na': { weight: 22.990,  nameCn: '钠', nameEn: 'Sodium' },
  'Mg': { weight: 24.305,  nameCn: '镁', nameEn: 'Magnesium' },
  'Al': { weight: 26.982,  nameCn: '铝', nameEn: 'Aluminum' },
  'Si': { weight: 28.085,  nameCn: '硅', nameEn: 'Silicon' },
  'P':  { weight: 30.974,  nameCn: '磷', nameEn: 'Phosphorus' },
  'S':  { weight: 32.06,   nameCn: '硫', nameEn: 'Sulfur' },
  'Cl': { weight: 35.45,   nameCn: '氯', nameEn: 'Chlorine' },
  'Ar': { weight: 39.948,  nameCn: '氩', nameEn: 'Argon' },
  'K':  { weight: 39.098,  nameCn: '钾', nameEn: 'Potassium' },
  'Ca': { weight: 40.078,  nameCn: '钙', nameEn: 'Calcium' },
  'Sc': { weight: 44.956,  nameCn: '钪', nameEn: 'Scandium' },
  'Ti': { weight: 47.867,  nameCn: '钛', nameEn: 'Titanium' },
  'V':  { weight: 50.942,  nameCn: '钒', nameEn: 'Vanadium' },
  'Cr': { weight: 51.996,  nameCn: '铬', nameEn: 'Chromium' },
  'Mn': { weight: 54.938,  nameCn: '锰', nameEn: 'Manganese' },
  'Fe': { weight: 55.845,  nameCn: '铁', nameEn: 'Iron' },
  'Co': { weight: 58.933,  nameCn: '钴', nameEn: 'Cobalt' },
  'Ni': { weight: 58.693,  nameCn: '镍', nameEn: 'Nickel' },
  'Cu': { weight: 63.546,  nameCn: '铜', nameEn: 'Copper' },
  'Zn': { weight: 65.38,   nameCn: '锌', nameEn: 'Zinc' },
  'Ga': { weight: 69.723,  nameCn: '镓', nameEn: 'Gallium' },
  'Ge': { weight: 72.630,  nameCn: '锗', nameEn: 'Germanium' },
  'As': { weight: 74.922,  nameCn: '砷', nameEn: 'Arsenic' },
  'Se': { weight: 78.971,  nameCn: '硒', nameEn: 'Selenium' },
  'Br': { weight: 79.904,  nameCn: '溴', nameEn: 'Bromine' },
  'Kr': { weight: 83.798,  nameCn: '氪', nameEn: 'Krypton' },
  'Rb': { weight: 85.468,  nameCn: '铷', nameEn: 'Rubidium' },
  'Sr': { weight: 87.62,   nameCn: '锶', nameEn: 'Strontium' },
  'Y':  { weight: 88.906,  nameCn: '钇', nameEn: 'Yttrium' },
  'Zr': { weight: 91.224,  nameCn: '锆', nameEn: 'Zirconium' },
  'Nb': { weight: 92.906,  nameCn: '铌', nameEn: 'Niobium' },
  'Mo': { weight: 95.95,   nameCn: '钼', nameEn: 'Molybdenum' },
  'Tc': { weight: 98,      nameCn: '锝', nameEn: 'Technetium' },
  'Ru': { weight: 101.07,  nameCn: '钌', nameEn: 'Ruthenium' },
  'Rh': { weight: 102.91,  nameCn: '铑', nameEn: 'Rhodium' },
  'Pd': { weight: 106.42,  nameCn: '钯', nameEn: 'Palladium' },
  'Ag': { weight: 107.87,  nameCn: '银', nameEn: 'Silver' },
  'Cd': { weight: 112.41,  nameCn: '镉', nameEn: 'Cadmium' },
  'In': { weight: 114.82,  nameCn: '铟', nameEn: 'Indium' },
  'Sn': { weight: 118.71,  nameCn: '锡', nameEn: 'Tin' },
  'Sb': { weight: 121.76,  nameCn: '锑', nameEn: 'Antimony' },
  'Te': { weight: 127.60,  nameCn: '碲', nameEn: 'Tellurium' },
  'I':  { weight: 126.90,  nameCn: '碘', nameEn: 'Iodine' },
  'Xe': { weight: 131.29,  nameCn: '氙', nameEn: 'Xenon' },
  'Cs': { weight: 132.91,  nameCn: '铯', nameEn: 'Cesium' },
  'Ba': { weight: 137.33,  nameCn: '钡', nameEn: 'Barium' },
  'La': { weight: 138.91,  nameCn: '镧', nameEn: 'Lanthanum' },
  'Ce': { weight: 140.12,  nameCn: '铈', nameEn: 'Cerium' },
  'Pt': { weight: 195.08,  nameCn: '铂', nameEn: 'Platinum' },
  'Au': { weight: 196.97,  nameCn: '金', nameEn: 'Gold' },
  'Hg': { weight: 200.59,  nameCn: '汞', nameEn: 'Mercury' },
  'Pb': { weight: 207.2,   nameCn: '铅', nameEn: 'Lead' }
};

/**
 * 常用成分预设数据库
 */
export interface PresetIngredient {
  nameCn: string;
  nameEn: string;
  formula: string;
  mw: number;
  category: 'supplement' | 'cosmetic';
  type: string;
  desc?: string;
}

export const PRESET_INGREDIENTS: PresetIngredient[] = [
  // 保健品
  { nameCn: '维生素C (抗坏血酸)', nameEn: 'Vitamin C (Ascorbic Acid)', formula: 'C6H8O6', mw: 176.12, category: 'supplement', type: '维生素', desc: '强抗氧化剂，促进胶原蛋白合成。' },
  { nameCn: '维生素E (α-生育酚)', nameEn: 'Vitamin E (Tocopherol)', formula: 'C29H50O2', mw: 430.71, category: 'supplement', type: '维生素', desc: '脂溶性抗氧化剂，保护细胞膜。' },
  { nameCn: '维生素A (视黄醇)', nameEn: 'Vitamin A (Retinol)', formula: 'C20H30O', mw: 286.45, category: 'supplement', type: '维生素', desc: '维持视力和皮肤健康。' },
  { nameCn: '维生素D3 (胆钙化醇)', nameEn: 'Vitamin D3 (Cholecalciferol)', formula: 'C27H44O', mw: 384.64, category: 'supplement', type: '维生素', desc: '促进钙磷吸收。' },
  { nameCn: '辅酶Q10', nameEn: 'Coenzyme Q10', formula: 'C59H90O4', mw: 863.34, category: 'supplement', type: '辅酶', desc: '参与细胞能量生成，心肌保护。' },
  { nameCn: '白藜芦醇', nameEn: 'Resveratrol', formula: 'C14H12O3', mw: 228.24, category: 'supplement', type: '植物提取', desc: '多酚类抗氧化剂，延缓衰老。' },
  { nameCn: '叶黄素', nameEn: 'Lutein', formula: 'C40H56O2', mw: 568.87, category: 'supplement', type: '类胡萝卜素', desc: '保护视网膜黄斑区，抗蓝光。' },
  { nameCn: '葡萄糖酸锌', nameEn: 'Zinc Gluconate', formula: 'C12H22O14Zn', mw: 455.68, category: 'supplement', type: '矿物质', desc: '补锌剂，增强免疫力与组织修复。' },
  
  // 化妆品
  { nameCn: '烟酰胺 (维生素B3)', nameEn: 'Niacinamide', formula: 'C6H6N2O', mw: 122.13, category: 'cosmetic', type: '美白/控油', desc: '抑制黑色素转移，改善皮脂腺。' },
  { nameCn: '水杨酸', nameEn: 'Salicylic Acid', formula: 'C7H6O3', mw: 138.12, category: 'cosmetic', type: '祛痘/角质剥脱', desc: '脂溶性有机酸，深入毛孔清洁。' },
  { nameCn: '苯氧乙醇', nameEn: 'Phenoxyethanol', formula: 'C8H10O2', mw: 138.16, category: 'cosmetic', type: '防腐剂', desc: '广谱防腐剂，安全用量上限为1.0%。' },
  { nameCn: '甘草酸二钾', nameEn: 'Dipotassium Glycyrrhizinate', formula: 'C42H60K2O16', mw: 899.13, category: 'cosmetic', type: '抗炎/舒缓', desc: '提取自甘草，强效舒缓抗炎。' },
  { nameCn: '透明质酸钠单体', nameEn: 'Sodium Hyaluronate monomer', formula: 'C14H20NNaO11', mw: 401.30, category: 'cosmetic', type: '保湿', desc: '天然保湿因子单体结构。' },
  { nameCn: '尿囊素', nameEn: 'Allantoin', formula: 'C4H6N4O3', mw: 158.12, category: 'cosmetic', type: '修护/舒缓', desc: '促进细胞生长，舒缓敏感。' },
  { nameCn: '腺苷', nameEn: 'Adenosine', formula: 'C10H13N5O4', mw: 267.24, category: 'cosmetic', type: '抗皱/赋活', desc: '调节细胞代谢，舒缓肌肤细纹。' },
  { nameCn: '泛醇 (维生素B5)', nameEn: 'Panthenol', formula: 'C9H19NO4', mw: 205.25, category: 'cosmetic', type: '保湿/修护', desc: '强效透皮吸收保湿剂，促进创面愈合。' }
];

export interface FormulaParseResult {
  molecularWeight: number;
  composition: Record<string, number>;
  formula: string;
  error?: string;
}

/**
 * 解析单部分化学式（不含前导系数和括号）
 */
function parseBasicFormula(tokens: string[]): Record<string, number> {
  const stack: Record<string, number>[] = [{}];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token === '(') {
      stack.push({});
    } else if (token === ')') {
      const group = stack.pop();
      if (!group) throw new Error('括号不匹配');
      
      // 检查右括号后面是否有数字系数
      let multiplier = 1;
      if (i + 1 < tokens.length && /^\d+(\.\d+)?$/.test(tokens[i + 1])) {
        multiplier = parseFloat(tokens[i + 1]);
        i++;
      }
      
      const parent = stack[stack.length - 1];
      for (const [elem, count] of Object.entries(group)) {
        parent[elem] = (parent[elem] || 0) + count * multiplier;
      }
    } else if (/^[A-Z][a-z]?$/.test(token)) {
      // 元素符号
      let count = 1;
      if (i + 1 < tokens.length && /^\d+(\.\d+)?$/.test(tokens[i + 1])) {
        count = parseFloat(tokens[i + 1]);
        i++;
      }
      const current = stack[stack.length - 1];
      current[token] = (current[token] || 0) + count;
    }
    i++;
  }

  if (stack.length !== 1) {
    throw new Error('括号未正确闭合');
  }

  return stack[0];
}

/**
 * 主入口：解析任意复杂化学式
 * 支持水合物，如 "CuSO4·5H2O" 或 "2KCl·MgCl2·6H2O"
 */
export function parseFormula(formula: string): FormulaParseResult {
  try {
    const cleanFormula = formula.replace(/\s+/g, ''); // 去除空格
    if (!cleanFormula) {
      return { molecularWeight: 0, composition: {}, formula: '', error: '输入不能为空' };
    }

    // 分割水合物点号 (·)
    const parts = cleanFormula.split(/[·•.]/);
    const totalComposition: Record<string, number> = {};

    for (const part of parts) {
      if (!part) continue;

      // 提取前导系数 (如 5H2O 中的 5)
      const leadingMatch = part.match(/^(\d+(?:\.\d+)?)/);
      let coefficient = 1;
      let formulaPart = part;

      if (leadingMatch) {
        coefficient = parseFloat(leadingMatch[1]);
        formulaPart = part.substring(leadingMatch[1].length);
      }

      // 对该部分公式进行分词
      // 匹配: 大写开头的元素（如 Ca, H）、括号、数字系数
      const tokens = formulaPart.match(/[A-Z][a-z]?|\(|\)|\d+(?:\.\d+)?/g) || [];
      const partComposition = parseBasicFormula(tokens);

      // 将该部分计入总组成中
      for (const [elem, count] of Object.entries(partComposition)) {
        totalComposition[elem] = (totalComposition[elem] || 0) + count * coefficient;
      }
    }

    // 计算总分子量并校验元素合法性
    let totalMW = 0;
    for (const [elem, count] of Object.entries(totalComposition)) {
      const elementInfo = ATOMIC_WEIGHTS[elem];
      if (!elementInfo) {
        throw new Error(`未知化学元素: "${elem}"`);
      }
      totalMW += elementInfo.weight * count;
    }

    return {
      molecularWeight: Math.round(totalMW * 1000) / 1000, // 保留三位小数
      composition: totalComposition,
      formula: cleanFormula
    };
  } catch (err: any) {
    return {
      molecularWeight: 0,
      composition: {},
      formula,
      error: err.message || '化学式格式解析错误'
    };
  }
}
