/**
 * 元素周期表原子量数据
 */
export const ATOMIC_WEIGHTS: Record<string, { weight: number; nameCn: string; nameEn: string }> = {
  'H':  { weight: 1.008,   nameCn: 'Hydrogen', nameEn: 'Hydrogen' },
  'He': { weight: 4.0026,  nameCn: 'Helium', nameEn: 'Helium' },
  'Li': { weight: 6.94,    nameCn: 'Lithium', nameEn: 'Lithium' },
  'Be': { weight: 9.0122,  nameCn: 'Beryllium', nameEn: 'Beryllium' },
  'B':  { weight: 10.81,   nameCn: 'Boron', nameEn: 'Boron' },
  'C':  { weight: 12.011,  nameCn: 'Carbon', nameEn: 'Carbon' },
  'N':  { weight: 14.007,  nameCn: 'Nitrogen', nameEn: 'Nitrogen' },
  'O':  { weight: 15.999,  nameCn: 'Oxygen', nameEn: 'Oxygen' },
  'F':  { weight: 18.998,  nameCn: 'Fluorine', nameEn: 'Fluorine' },
  'Ne': { weight: 20.180,  nameCn: 'Neon', nameEn: 'Neon' },
  'Na': { weight: 22.990,  nameCn: 'Sodium', nameEn: 'Sodium' },
  'Mg': { weight: 24.305,  nameCn: 'Magnesium', nameEn: 'Magnesium' },
  'Al': { weight: 26.982,  nameCn: 'Aluminum', nameEn: 'Aluminum' },
  'Si': { weight: 28.085,  nameCn: 'Silicon', nameEn: 'Silicon' },
  'P':  { weight: 30.974,  nameCn: 'Phosphorus', nameEn: 'Phosphorus' },
  'S':  { weight: 32.06,   nameCn: 'Sulfur', nameEn: 'Sulfur' },
  'Cl': { weight: 35.45,   nameCn: 'Chlorine', nameEn: 'Chlorine' },
  'Ar': { weight: 39.948,  nameCn: 'Argon', nameEn: 'Argon' },
  'K':  { weight: 39.098,  nameCn: 'Potassium', nameEn: 'Potassium' },
  'Ca': { weight: 40.078,  nameCn: 'Calcium', nameEn: 'Calcium' },
  'Sc': { weight: 44.956,  nameCn: 'Scandium', nameEn: 'Scandium' },
  'Ti': { weight: 47.867,  nameCn: 'Titanium', nameEn: 'Titanium' },
  'V':  { weight: 50.942,  nameCn: 'Vanadium', nameEn: 'Vanadium' },
  'Cr': { weight: 51.996,  nameCn: 'Chromium', nameEn: 'Chromium' },
  'Mn': { weight: 54.938,  nameCn: 'Manganese', nameEn: 'Manganese' },
  'Fe': { weight: 55.845,  nameCn: 'Iron', nameEn: 'Iron' },
  'Co': { weight: 58.933,  nameCn: 'Cobalt', nameEn: 'Cobalt' },
  'Ni': { weight: 58.693,  nameCn: 'Nickel', nameEn: 'Nickel' },
  'Cu': { weight: 63.546,  nameCn: 'Copper', nameEn: 'Copper' },
  'Zn': { weight: 65.38,   nameCn: 'Zinc', nameEn: 'Zinc' },
  'Ga': { weight: 69.723,  nameCn: 'Gallium', nameEn: 'Gallium' },
  'Ge': { weight: 72.630,  nameCn: 'Germanium', nameEn: 'Germanium' },
  'As': { weight: 74.922,  nameCn: 'Arsenic', nameEn: 'Arsenic' },
  'Se': { weight: 78.971,  nameCn: 'Selenium', nameEn: 'Selenium' },
  'Br': { weight: 79.904,  nameCn: 'Bromine', nameEn: 'Bromine' },
  'Kr': { weight: 83.798,  nameCn: 'Krypton', nameEn: 'Krypton' },
  'Rb': { weight: 85.468,  nameCn: 'Rubidium', nameEn: 'Rubidium' },
  'Sr': { weight: 87.62,   nameCn: 'Strontium', nameEn: 'Strontium' },
  'Y':  { weight: 88.906,  nameCn: 'Yttrium', nameEn: 'Yttrium' },
  'Zr': { weight: 91.224,  nameCn: 'Zirconium', nameEn: 'Zirconium' },
  'Nb': { weight: 92.906,  nameCn: 'Niobium', nameEn: 'Niobium' },
  'Mo': { weight: 95.95,   nameCn: 'Molybdenum', nameEn: 'Molybdenum' },
  'Tc': { weight: 98,      nameCn: 'Technetium', nameEn: 'Technetium' },
  'Ru': { weight: 101.07,  nameCn: 'Ruthenium', nameEn: 'Ruthenium' },
  'Rh': { weight: 102.91,  nameCn: 'Rhodium', nameEn: 'Rhodium' },
  'Pd': { weight: 106.42,  nameCn: 'Palladium', nameEn: 'Palladium' },
  'Ag': { weight: 107.87,  nameCn: 'Silver', nameEn: 'Silver' },
  'Cd': { weight: 112.41,  nameCn: 'Cadmium', nameEn: 'Cadmium' },
  'In': { weight: 114.82,  nameCn: 'Indium', nameEn: 'Indium' },
  'Sn': { weight: 118.71,  nameCn: 'Tin', nameEn: 'Tin' },
  'Sb': { weight: 121.76,  nameCn: 'Antimony', nameEn: 'Antimony' },
  'Te': { weight: 127.60,  nameCn: 'Tellurium', nameEn: 'Tellurium' },
  'I':  { weight: 126.90,  nameCn: 'Iodine', nameEn: 'Iodine' },
  'Xe': { weight: 131.29,  nameCn: 'Xenon', nameEn: 'Xenon' },
  'Cs': { weight: 132.91,  nameCn: 'Cesium', nameEn: 'Cesium' },
  'Ba': { weight: 137.33,  nameCn: 'Barium', nameEn: 'Barium' },
  'La': { weight: 138.91,  nameCn: 'Lanthanum', nameEn: 'Lanthanum' },
  'Ce': { weight: 140.12,  nameCn: 'Cerium', nameEn: 'Cerium' },
  'Pt': { weight: 195.08,  nameCn: 'Platinum', nameEn: 'Platinum' },
  'Au': { weight: 196.97,  nameCn: 'Gold', nameEn: 'Gold' },
  'Hg': { weight: 200.59,  nameCn: 'Mercury', nameEn: 'Mercury' },
  'Pb': { weight: 207.2,   nameCn: 'Lead', nameEn: 'Lead' }
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
  // Supplements
  { nameCn: '维生素C (抗坏血酸)', nameEn: 'Vitamin C (Ascorbic Acid)', formula: 'C6H8O6', mw: 176.12, category: 'supplement', type: 'Vitamin', desc: '强效抗氧化剂，促进胶原蛋白合成，日推荐量100mg。' },
  { nameCn: '维生素E (生育酚)', nameEn: 'Vitamin E (Tocopherol)', formula: 'C29H50O2', mw: 430.71, category: 'supplement', type: 'Vitamin', desc: '脂溶性抗氧化剂，保护细胞膜，日推荐量15mg。' },
  { nameCn: '维生素A (视黄醇)', nameEn: 'Vitamin A (Retinol)', formula: 'C20H30O', mw: 286.45, category: 'supplement', type: 'Vitamin', desc: '维持视觉、皮肤健康及基因转录。' },
  { nameCn: '维生素D3 (胆钙化醇)', nameEn: 'Vitamin D3 (Cholecalciferol)', formula: 'C27H44O', mw: 384.64, category: 'supplement', type: 'Vitamin', desc: '促进小肠对钙、磷的吸收，维持骨骼健康。' },
  { nameCn: '辅酶Q10', nameEn: 'Coenzyme Q10', formula: 'C59H90O4', mw: 863.34, category: 'supplement', type: 'Coenzyme', desc: '细胞能量代谢辅酶，强抗氧化，心肌保护，推荐量30-50mg。' },
  { nameCn: '白藜芦醇', nameEn: 'Resveratrol', formula: 'C14H12O3', mw: 228.24, category: 'supplement', type: 'Polyphenol', desc: '多酚类抗氧化剂，延缓衰老，心血管保护。' },
  { nameCn: '叶黄素', nameEn: 'Lutein', formula: 'C40H56O2', mw: 568.87, category: 'supplement', type: 'Carotenoid', desc: '保护视网膜黄斑，过滤有害蓝光，日用量约10mg。' },
  { nameCn: '葡萄糖酸锌', nameEn: 'Zinc Gluconate', formula: 'C12H22O14Zn', mw: 455.68, category: 'supplement', type: 'Mineral', desc: '高效补锌制剂，提升免疫力及组织修复速度。' },
  
  // Cosmetics
  { nameCn: '烟酰胺', nameEn: 'Niacinamide', formula: 'C6H6N2O', mw: 122.13, category: 'cosmetic', type: 'Active / Sebum Control', desc: '抑制黑色素转移，控油及修护皮肤屏障，推荐比例2-5%。' },
  { nameCn: '水杨酸', nameEn: 'Salicylic Acid', formula: 'C7H6O3', mw: 138.12, category: 'cosmetic', type: 'Acne Control / Exfoliator', desc: '脂溶性BHA，清理毛孔内油脂与老废角质，法规限量2%。' },
  { nameCn: '苯氧乙醇', nameEn: 'Phenoxyethanol', formula: 'C8H10O2', mw: 138.16, category: 'cosmetic', type: 'Preservative', desc: '广谱防腐剂，常温稳定。化妆品安全技术规范限量1.0%。' },
  { nameCn: '甘草酸二钾', nameEn: 'Dipotassium Glycyrrhizinate', formula: 'C42H60K2O16', mw: 899.13, category: 'cosmetic', type: 'Soothing / Anti-inflammatory', desc: '甘草提取物，极佳抗炎舒缓效果，改善皮肤泛红，限量0.5%。' },
  { nameCn: '透明质酸钠 (单体)', nameEn: 'Sodium Hyaluronate monomer', formula: 'C14H20NNaO11', mw: 401.30, category: 'cosmetic', type: 'Humectant', desc: '天然保湿因子单体结构，吸水保水能力极强。' },
  { nameCn: '尿囊素', nameEn: 'Allantoin', formula: 'C4H6N4O3', mw: 158.12, category: 'cosmetic', type: 'Repair / Soothing', desc: '促进细胞复活与伤口愈合，舒缓干燥蜕皮，比例0.1-0.5%。' },
  { nameCn: '腺苷', nameEn: 'Adenosine', formula: 'C10H13N5O4', mw: 267.24, category: 'cosmetic', type: 'Anti-wrinkle', desc: '调理细胞代谢，淡化皱纹，改善弹性。' },
  { nameCn: '泛醇 (维生素B5)', nameEn: 'Panthenol', formula: 'C9H19NO4', mw: 205.25, category: 'cosmetic', type: 'Humectant / Repair', desc: '深层渗透保湿，促进上皮细胞增殖修护，比例0.5-5%。' }
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
      if (!group) throw new Error('Unbalanced parentheses');
      
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
    throw new Error('Parentheses not closed properly');
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
      return { molecularWeight: 0, composition: {}, formula: '', error: 'Input cannot be empty' };
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
        throw new Error(`Unknown chemical element: "${elem}"`);
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
      error: err.message || 'Chemical formula parsing error'
    };
  }
}
