/**
 * 保健品剂型模版、胶囊壳规格与 IU 换算数据定义
 */

export interface ExcipientTemplate {
  nameCn: string;
  nameEn: string;
  type: 'filler' | 'binder' | 'disintegrant' | 'lubricant' | 'glidant' | 'carrier' | 'suspending' | 'emulsifier' | 'solvent' | 'sweetener' | 'pH adjuster' | 'preservative';
  typicalPct: string;
  defaultPct: number; // 默认分配的百分比
}

export interface SupplementTemplate {
  name: string;
  nameCn: string;
  excipients: ExcipientTemplate[];
  targetWeight: number; // 默认单件重量（mg）
  unitLabel: string; // 片/粒/支/g
}

// 剂型预设模板
export const SUPPLEMENT_TEMPLATES: Record<string, SupplementTemplate> = {
  tablet: {
    name: 'Tablet Formulation Template',
    nameCn: '片剂标准配方模板',
    unitLabel: '片',
    targetWeight: 500, // 500mg
    excipients: [
      { nameCn: '微晶纤维素 (MCC)', nameEn: 'Microcrystalline Cellulose', type: 'filler', typicalPct: '30-60%', defaultPct: 50 },
      { nameCn: '聚维酮 K30', nameEn: 'Povidone K30', type: 'binder', typicalPct: '2-5%', defaultPct: 3 },
      { nameCn: '交联羧甲基纤维素钠 (交联CMC-Na)', nameEn: 'Croscarmellose Sodium', type: 'disintegrant', typicalPct: '2-5%', defaultPct: 3 },
      { nameCn: '硬脂酸镁', nameEn: 'Magnesium Stearate', type: 'lubricant', typicalPct: '0.5-1.5%', defaultPct: 1 },
      { nameCn: '微粉硅胶 (二氧化硅)', nameEn: 'Colloidal Silicon Dioxide', type: 'glidant', typicalPct: '0.5-1.5%', defaultPct: 0.5 }
    ]
  },
  capsule: {
    name: 'Hard Capsule Formulation Template',
    nameCn: '硬胶囊标准配方模板',
    unitLabel: '粒',
    targetWeight: 400, // 400mg
    excipients: [
      { nameCn: '预胶化淀粉', nameEn: 'Pregelatinized Starch', type: 'filler', typicalPct: '40-70%', defaultPct: 60 },
      { nameCn: '微晶纤维素 (MCC)', nameEn: 'Microcrystalline Cellulose', type: 'filler', typicalPct: '10-30%', defaultPct: 20 },
      { nameCn: '硬脂酸镁', nameEn: 'Magnesium Stearate', type: 'lubricant', typicalPct: '0.5-1.5%', defaultPct: 1 }
    ]
  },
  softgel: {
    name: 'Softgel Content Template',
    nameCn: '软胶囊内容物配方模板',
    unitLabel: '粒',
    targetWeight: 1000, // 1000mg
    excipients: [
      { nameCn: '精炼大豆油', nameEn: 'Refined Soybean Oil', type: 'carrier', typicalPct: '60-90%', defaultPct: 80 },
      { nameCn: '天然黄蜂蜡', nameEn: 'Beeswax', type: 'suspending', typicalPct: '3-8%', defaultPct: 5 },
      { nameCn: '大豆卵磷脂', nameEn: 'Soy Lecithin', type: 'emulsifier', typicalPct: '1-3%', defaultPct: 2 }
    ]
  },
  liquid: {
    name: 'Oral Liquid Formulation Template',
    nameCn: '口服液配方模板',
    unitLabel: '支 (10mL)',
    targetWeight: 10000, // 10000mg (10g)
    excipients: [
      { nameCn: '纯化水', nameEn: 'Purified Water', type: 'solvent', typicalPct: '80-95%', defaultPct: 85 },
      { nameCn: '山梨糖醇液 (70%)', nameEn: 'Sorbitol Solution (70%)', type: 'sweetener', typicalPct: '5-15%', defaultPct: 10 },
      { nameCn: '无水柠檬酸', nameEn: 'Citric Acid Anhydrous', type: 'pH adjuster', typicalPct: '0.1-0.5%', defaultPct: 0.2 },
      { nameCn: '山梨酸钾', nameEn: 'Potassium Sorbate', type: 'preservative', typicalPct: '0.05-0.15%', defaultPct: 0.1 }
    ]
  },
  powder: {
    name: 'Powder Blend Template',
    nameCn: '固体饮料/粉剂配方模板',
    unitLabel: '袋 (5g)',
    targetWeight: 5000, // 5000mg (5g)
    excipients: [
      { nameCn: '无水葡萄糖', nameEn: 'Anhydrous Dextrose', type: 'filler', typicalPct: '50-80%', defaultPct: 70 },
      { nameCn: '麦芽糊精', nameEn: 'Maltodextrin', type: 'filler', typicalPct: '20-40%', defaultPct: 25 },
      { nameCn: '三氯蔗糖', nameEn: 'Sucralose', type: 'sweetener', typicalPct: '0.05-0.2%', defaultPct: 0.1 }
    ]
  }
};

// 胶囊型号装量推荐表
export interface CapsuleSpec {
  size: string;
  volume: number; // mL
  typicalCapacityMin: number; // mg (按松装密度 0.6g/mL 计算)
  typicalCapacityMax: number; // mg (按紧装密度 0.9g/mL 计算)
}

export const CAPSULE_SPECS: CapsuleSpec[] = [
  { size: '#00', volume: 0.95, typicalCapacityMin: 570, typicalCapacityMax: 855 },
  { size: '#0',  volume: 0.68, typicalCapacityMin: 408, typicalCapacityMax: 612 },
  { size: '#1',  volume: 0.50, typicalCapacityMin: 300, typicalCapacityMax: 450 },
  { size: '#2',  volume: 0.37, typicalCapacityMin: 222, typicalCapacityMax: 333 },
  { size: '#3',  volume: 0.30, typicalCapacityMin: 180, typicalCapacityMax: 270 },
  { size: '#4',  volume: 0.21, typicalCapacityMin: 126, typicalCapacityMax: 189 }
];

// IU ↔ mg 转换关系
export interface IUDictItem {
  nameCn: string;
  nameEn: string;
  iuToMg: number; // 1 IU 等于多少毫克 mg
  mgToIu: number; // 1 mg 等于多少国际单位 IU
}

export const IU_FACTORS: Record<string, IUDictItem> = {
  vitA: {
    nameCn: '维生素A (视黄醇当量)',
    nameEn: 'Vitamin A (Retinol)',
    iuToMg: 0.0003,       // 1 IU = 0.3 μg = 0.0003 mg
    mgToIu: 1 / 0.0003    // 1 mg = 3333.33 IU
  },
  vitD3: {
    nameCn: '维生素D3 (胆钙化醇)',
    nameEn: 'Vitamin D3 (Cholecalciferol)',
    iuToMg: 0.000025,     // 1 IU = 0.025 μg = 0.000025 mg
    mgToIu: 1 / 0.000025  // 1 mg = 40000 IU
  },
  vitE: {
    nameCn: '维生素E (d-α-生育酚)',
    nameEn: 'Vitamin E (d-alpha-tocopherol)',
    iuToMg: 0.67,         // 1 IU = 0.67 mg
    mgToIu: 1 / 0.67      // 1 mg = 1.49 IU
  }
};
