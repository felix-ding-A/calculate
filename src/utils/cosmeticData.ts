/**
 * 化妆品配方 HLB 数据库、法规限制与经典配方模板定义
 */

export interface CosmeticIngredientLimit {
  nameCn: string;
  nameEn: string;
  maxUsagePct: number; // 法规最大限量百分比 (%)
  ref: string; // 引用法规
}

// 常用活性物与防腐剂限值
export const REGULATORY_LIMITS: Record<string, CosmeticIngredientLimit> = {
  'Phenoxyethanol': { nameCn: '苯氧乙醇', nameEn: 'Phenoxyethanol', maxUsagePct: 1.0, ref: '《化妆品安全技术规范》(2015) 防腐剂表' },
  'Salicylic Acid': { nameCn: '水杨酸', nameEn: 'Salicylic Acid', maxUsagePct: 2.0, ref: '驻留类及淋洗类最大限量 (2.0%)' },
  'Niacinamide': { nameCn: '烟酰胺', nameEn: 'Niacinamide', maxUsagePct: 5.0, ref: '业界公认温和屏障上限 (5.0%)' },
  'Retinol': { nameCn: '视黄醇 (A醇)', nameEn: 'Retinol', maxUsagePct: 1.0, ref: '高活性抗衰上限比例' },
  'Dipotassium Glycyrrhizinate': { nameCn: '甘草酸二钾', nameEn: 'Dipotassium Glycyrrhizinate', maxUsagePct: 0.5, ref: '舒缓抑炎推荐限量 (0.5%)' },
  'Methylisothiazolinone': { nameCn: '甲基异噻唑啉酮 (MIT)', nameEn: 'Methylisothiazolinone', maxUsagePct: 0.01, ref: '驻留类禁用，淋洗类上限 0.01%' }
};

// 常见油相的 Required HLB 值
export const OIL_HLB_VALUES: Record<string, number> = {
  'GTCC (辛酸/癸酸甘油三酯)': 5.0,
  '角鲨烷 (Squalane)': 11.0,
  '鲸蜡醇/鲸蜡硬脂醇': 15.5,
  '乳木果脂 (Shea Butter)': 8.0,
  '矿物油 (Mineral Oil)': 10.5,
  '蜂蜡 (Beeswax)': 12.0,
  '荷荷巴油 (Jojoba Oil)': 6.5,
  '甜杏仁油 (Sweet Almond Oil)': 7.0,
  '橄榄油 (Olive Oil)': 7.0,
  '异十六烷 (Isohexadecane)': 7.5,
  '硅油 (Dimethicone / D5)': 7.5
};

// 常用乳化剂的 HLB 值
export const EMULSIFIER_HLB: Record<string, number> = {
  '吐温80 (Tween 80)': 15.0,
  '司盘80 (Span 80)': 4.3,
  '吐温60 (Tween 60)': 14.9,
  '司盘60 (Span 60)': 4.7,
  '吐温20 (Tween 20)': 16.7,
  '司盘20 (Span 20)': 8.6,
  '单硬脂酸甘油酯 (GMS)': 3.8,
  'PEG-100 硬脂酸酯': 18.8,
  'Montanov 68': 8.0,
  'Montanov 202': 9.0
};

export interface CosmeticIngredientPreset {
  name: string;
  percentage: number;
  type: 'solvent' | 'humectant' | 'thickener' | 'emollient' | 'emulsifier' | 'active' | 'preservative' | 'fragrance' | 'pH_adjuster' | 'chelator';
}

export interface CosmeticTemplate {
  name: string;
  nameCn: string;
  phases: Record<string, CosmeticIngredientPreset[]>;
  targetWeight: number; // 默认小样克数 (g)
  desc: string;
}

// 经典化妆品配方体系
export const COSMETIC_TEMPLATES: Record<string, CosmeticTemplate> = {
  serum: {
    name: 'Standard Hyaluronic & Niacinamide Serum',
    nameCn: '玻尿酸烟酰胺精华液模板',
    targetWeight: 100, // 100g
    desc: 'O/W 水敏性体系。烟酰胺亮肤，高低分子玻尿酸立体保湿，肤感清爽。',
    phases: {
      'Phase A (水相)': [
        { name: '去离子水 (Deionized Water)', percentage: 86.35, type: 'solvent' },
        { name: '甘油 (Glycerin)', percentage: 5.0, type: 'humectant' },
        { name: '丁二醇 (Butylene Glycol)', percentage: 3.0, type: 'humectant' },
        { name: '黄原胶 (Xanthan Gum)', percentage: 0.15, type: 'thickener' },
        { name: 'EDTA二钠 (EDTA-2Na)', percentage: 0.05, type: 'chelator' }
      ],
      'Phase B (油相/乳化)': [], // 精华液通常无油相
      'Phase C (功效成分)': [
        { name: '烟酰胺 (Niacinamide)', percentage: 3.0, type: 'active' },
        { name: '透明质酸钠 (Sodium Hyaluronate)', percentage: 0.1, type: 'active' },
        { name: '1,2-己二醇 (1,2-Hexanediol)', percentage: 0.8, type: 'active' }
      ],
      'Phase D (防腐香精)': [
        { name: '苯氧乙醇 (Phenoxyethanol)', percentage: 1.5, type: 'preservative' } // 稍高于限量，供报警测试
      ]
    }
  },
  cream: {
    name: 'O/W Moisturising Face Cream',
    nameCn: 'O/W 舒缓保湿面霜模板',
    targetWeight: 50, // 50g
    desc: '经典的 O/W 面霜乳化体系。GTCC+角鲨烷作为润肤油，采用复配乳化。',
    phases: {
      'Phase A (水相)': [
        { name: '去离子水 (Deionized Water)', percentage: 67.8, type: 'solvent' },
        { name: '甘油 (Glycerin)', percentage: 5.0, type: 'humectant' },
        { name: '卡波姆 (Carbomer)', percentage: 0.2, type: 'thickener' }
      ],
      'Phase B (油相/乳化)': [
        { name: 'GTCC (辛酸/癸酸甘油三酯)', percentage: 8.0, type: 'emollient' },
        { name: '角鲨烷 (Squalane)', percentage: 5.0, type: 'emollient' },
        { name: '鲸蜡硬脂醇', percentage: 2.0, type: 'emollient' },
        { name: '吐温80 (Tween 80)', percentage: 2.5, type: 'emulsifier' },
        { name: '司盘80 (Span 80)', percentage: 1.5, type: 'emulsifier' }
      ],
      'Phase C (功效成分)': [
        { name: '天然维生素E (Tocopherol)', percentage: 1.0, type: 'active' },
        { name: '甘草酸二钾 (Dipotassium Glycyrrhizinate)', percentage: 0.2, type: 'active' }
      ],
      'Phase D (防腐香精)': [
        { name: '苯氧乙醇 (Phenoxyethanol)', percentage: 0.6, type: 'preservative' },
        { name: '香精 (Fragrance)', percentage: 0.2, type: 'fragrance' }
      ]
    }
  },
  lotion: {
    name: 'O/W Lightweight Body Lotion',
    nameCn: 'O/W 清爽身体乳液模板',
    targetWeight: 200, // 200g
    desc: '极佳铺展性的水包油轻盈乳液，适合大面积涂抹涂敷。',
    phases: {
      'Phase A (水相)': [
        { name: '去离子水 (Deionized Water)', percentage: 76.5, type: 'solvent' },
        { name: '丙二醇 (Propylene Glycol)', percentage: 4.0, type: 'humectant' },
        { name: '黄原胶 (Xanthan Gum)', percentage: 0.1, type: 'thickener' }
      ],
      'Phase B (油相/乳化)': [
        { name: '矿物油 (Mineral Oil)', percentage: 10.0, type: 'emollient' },
        { name: '鲸蜡硬脂醇', percentage: 3.0, type: 'emollient' },
        { name: '吐温60 (Tween 60)', percentage: 3.5, type: 'emulsifier' },
        { name: '司盘60 (Span 60)', percentage: 1.5, type: 'emulsifier' }
      ],
      'Phase C (功效成分)': [
        { name: '尿囊素 (Allantoin)', percentage: 0.5, type: 'active' },
        { name: '泛醇 (Panthenol)', percentage: 0.5, type: 'active' }
      ],
      'Phase D (防腐香精)': [
        { name: '苯氧乙醇 (Phenoxyethanol)', percentage: 0.4, type: 'preservative' }
      ]
    }
  }
};
