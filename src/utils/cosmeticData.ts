/**
 * Cosmetic formulation HLB database, regulatory limits, and classic formulation templates
 */

export interface CosmeticIngredientLimit {
  nameCn: string;
  nameEn: string;
  maxUsagePct: number; // Regulatory maximum usage percentage (%)
  ref: string; // Reference regulation
}

// Common actives and preservative limits
export const REGULATORY_LIMITS: Record<string, CosmeticIngredientLimit> = {
  'Phenoxyethanol': { nameCn: 'Phenoxyethanol', nameEn: 'Phenoxyethanol', maxUsagePct: 1.0, ref: 'Cosmetic Safety Technical Standards (2015) Preservatives List' },
  'Salicylic Acid': { nameCn: 'Salicylic Acid', nameEn: 'Salicylic Acid', maxUsagePct: 2.0, ref: 'Leave-on & Rinse-off max limit (2.0%)' },
  'Niacinamide': { nameCn: 'Niacinamide', nameEn: 'Niacinamide', maxUsagePct: 5.0, ref: 'Industry recognized gentle barrier upper limit (5.0%)' },
  'Retinol': { nameCn: 'Retinol', nameEn: 'Retinol', maxUsagePct: 1.0, ref: 'High active anti-aging upper limit (1.0%)' },
  'Dipotassium Glycyrrhizinate': { nameCn: 'Dipotassium Glycyrrhizinate', nameEn: 'Dipotassium Glycyrrhizinate', maxUsagePct: 0.5, ref: 'Soothe and anti-inflammatory recommended limit (0.5%)' },
  'Methylisothiazolinone': { nameCn: 'Methylisothiazolinone', nameEn: 'Methylisothiazolinone', maxUsagePct: 0.01, ref: 'Prohibited in leave-on, max 0.01% in rinse-off' }
};

// Required HLB values of common oil phases
export const OIL_HLB_VALUES: Record<string, number> = {
  'GTCC (Caprylic/Capric Triglyceride)': 5.0,
  'Squalane': 11.0,
  'Cetyl/Cetearyl Alcohol': 15.5,
  'Shea Butter': 8.0,
  'Mineral Oil': 10.5,
  'Beeswax': 12.0,
  'Jojoba Oil': 6.5,
  'Sweet Almond Oil': 7.0,
  'Olive Oil': 7.0,
  'Isohexadecane': 7.5,
  'Dimethicone / D5': 7.5
};

// HLB values of common emulsifiers
export const EMULSIFIER_HLB: Record<string, number> = {
  'Tween 80': 15.0,
  'Span 80': 4.3,
  'Tween 60': 14.9,
  'Span 60': 4.7,
  'Tween 20': 16.7,
  'Span 20': 8.6,
  'GMS (Glyceryl Monostearate)': 3.8,
  'PEG-100 Stearate': 18.8,
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
  targetWeight: number; // Default sample weight (g)
  desc: string;
}

// Classic cosmetic formulation systems
export const COSMETIC_TEMPLATES: Record<string, CosmeticTemplate> = {
  serum: {
    name: 'Standard Hyaluronic & Niacinamide Serum',
    nameCn: 'Standard Hyaluronic & Niacinamide Serum',
    targetWeight: 100, // 100g
    desc: 'O/W water-soluble system. Niacinamide brightens skin, high and low molecular weight hyaluronic acid provides multi-dimensional hydration, fresh skin feel.',
    phases: {
      'Phase A (Water Phase)': [
        { name: 'Deionized Water', percentage: 86.35, type: 'solvent' },
        { name: 'Glycerin', percentage: 5.0, type: 'humectant' },
        { name: 'Butylene Glycol', percentage: 3.0, type: 'humectant' },
        { name: 'Xanthan Gum', percentage: 0.15, type: 'thickener' },
        { name: 'EDTA-2Na', percentage: 0.05, type: 'chelator' }
      ],
      'Phase B (Oil Phase / Emulsification)': [], // Serum typically has no oil phase
      'Phase C (Active Ingredients)': [
        { name: 'Niacinamide', percentage: 3.0, type: 'active' },
        { name: 'Sodium Hyaluronate', percentage: 0.1, type: 'active' },
        { name: '1,2-Hexanediol', percentage: 0.8, type: 'active' }
      ],
      'Phase D (Preservative & Fragrance)': [
        { name: 'Phenoxyethanol', percentage: 1.5, type: 'preservative' } // Slightly higher than limit for alert testing
      ]
    }
  },
  cream: {
    name: 'O/W Moisturising Face Cream',
    nameCn: 'O/W Moisturising Face Cream',
    targetWeight: 50, // 50g
    desc: 'Classic O/W face cream emulsification system. GTCC + Squalane as emollients, using blended emulsification.',
    phases: {
      'Phase A (Water Phase)': [
        { name: 'Deionized Water', percentage: 67.8, type: 'solvent' },
        { name: 'Glycerin', percentage: 5.0, type: 'humectant' },
        { name: 'Carbomer', percentage: 0.2, type: 'thickener' }
      ],
      'Phase B (Oil Phase / Emulsification)': [
        { name: 'GTCC (Caprylic/Capric Triglyceride)', percentage: 8.0, type: 'emollient' },
        { name: 'Squalane', percentage: 5.0, type: 'emollient' },
        { name: 'Cetearyl Alcohol', percentage: 2.0, type: 'emollient' },
        { name: 'Tween 80', percentage: 2.5, type: 'emulsifier' },
        { name: 'Span 80', percentage: 1.5, type: 'emulsifier' }
      ],
      'Phase C (Active Ingredients)': [
        { name: 'Tocopherol (Vitamin E)', percentage: 1.0, type: 'active' },
        { name: 'Dipotassium Glycyrrhizinate', percentage: 0.2, type: 'active' }
      ],
      'Phase D (Preservative & Fragrance)': [
        { name: 'Phenoxyethanol', percentage: 0.6, type: 'preservative' },
        { name: 'Fragrance', percentage: 0.2, type: 'fragrance' }
      ]
    }
  },
  lotion: {
    name: 'O/W Lightweight Body Lotion',
    nameCn: 'O/W Lightweight Body Lotion',
    targetWeight: 200, // 200g
    desc: 'Lightweight O/W body lotion with excellent spreadability, suitable for large area application.',
    phases: {
      'Phase A (Water Phase)': [
        { name: 'Deionized Water', percentage: 76.5, type: 'solvent' },
        { name: 'Propylene Glycol', percentage: 4.0, type: 'humectant' },
        { name: 'Xanthan Gum', percentage: 0.1, type: 'thickener' }
      ],
      'Phase B (Oil Phase / Emulsification)': [
        { name: 'Mineral Oil', percentage: 10.0, type: 'emollient' },
        { name: 'Cetearyl Alcohol', percentage: 3.0, type: 'emollient' },
        { name: 'Tween 60', percentage: 3.5, type: 'emulsifier' },
        { name: 'Span 60', percentage: 1.5, type: 'emulsifier' }
      ],
      'Phase C (Active Ingredients)': [
        { name: 'Allantoin', percentage: 0.5, type: 'active' },
        { name: 'Panthenol', percentage: 0.5, type: 'active' }
      ],
      'Phase D (Preservative & Fragrance)': [
        { name: 'Phenoxyethanol', percentage: 0.4, type: 'preservative' }
      ]
    }
  }
};
