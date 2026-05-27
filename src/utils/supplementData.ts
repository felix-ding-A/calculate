/**
 * Supplement formulation templates, capsule specifications, and IU conversion data definitions
 */

export interface ExcipientTemplate {
  nameCn: string;
  nameEn: string;
  type: 'filler' | 'binder' | 'disintegrant' | 'lubricant' | 'glidant' | 'carrier' | 'suspending' | 'emulsifier' | 'solvent' | 'sweetener' | 'pH adjuster' | 'preservative';
  typicalPct: string;
  defaultPct: number; // Default percentage allocated
}

export interface SupplementTemplate {
  name: string;
  nameCn: string;
  excipients: ExcipientTemplate[];
  targetWeight: number; // Default unit weight (mg)
  unitLabel: string; // Tablet/Capsule/Vial/g
}

// Formulation preset templates
export const SUPPLEMENT_TEMPLATES: Record<string, SupplementTemplate> = {
  tablet: {
    name: 'Tablet Formulation Template',
    nameCn: 'Tablet Formulation Template',
    unitLabel: 'Tablet',
    targetWeight: 500, // 500mg
    excipients: [
      { nameCn: 'MCC (Microcrystalline Cellulose)', nameEn: 'Microcrystalline Cellulose', type: 'filler', typicalPct: '30-60%', defaultPct: 50 },
      { nameCn: 'Povidone K30', nameEn: 'Povidone K30', type: 'binder', typicalPct: '2-5%', defaultPct: 3 },
      { nameCn: 'Croscarmellose Sodium (cross-linked CMC-Na)', nameEn: 'Croscarmellose Sodium', type: 'disintegrant', typicalPct: '2-5%', defaultPct: 3 },
      { nameCn: 'Magnesium Stearate', nameEn: 'Magnesium Stearate', type: 'lubricant', typicalPct: '0.5-1.5%', defaultPct: 1 },
      { nameCn: 'Colloidal Silicon Dioxide', nameEn: 'Colloidal Silicon Dioxide', type: 'glidant', typicalPct: '0.5-1.5%', defaultPct: 0.5 }
    ]
  },
  capsule: {
    name: 'Hard Capsule Formulation Template',
    nameCn: 'Hard Capsule Formulation Template',
    unitLabel: 'Capsule',
    targetWeight: 400, // 400mg
    excipients: [
      { nameCn: 'Pregelatinized Starch', nameEn: 'Pregelatinized Starch', type: 'filler', typicalPct: '40-70%', defaultPct: 60 },
      { nameCn: 'MCC (Microcrystalline Cellulose)', nameEn: 'Microcrystalline Cellulose', type: 'filler', typicalPct: '10-30%', defaultPct: 20 },
      { nameCn: 'Magnesium Stearate', nameEn: 'Magnesium Stearate', type: 'lubricant', typicalPct: '0.5-1.5%', defaultPct: 1 }
    ]
  },
  softgel: {
    name: 'Softgel Content Template',
    nameCn: 'Softgel Content Template',
    unitLabel: 'Softgel',
    targetWeight: 1000, // 1000mg
    excipients: [
      { nameCn: 'Refined Soybean Oil', nameEn: 'Refined Soybean Oil', type: 'carrier', typicalPct: '60-90%', defaultPct: 80 },
      { nameCn: 'Beeswax', nameEn: 'Beeswax', type: 'suspending', typicalPct: '3-8%', defaultPct: 5 },
      { nameCn: 'Soy Lecithin', nameEn: 'Soy Lecithin', type: 'emulsifier', typicalPct: '1-3%', defaultPct: 2 }
    ]
  },
  liquid: {
    name: 'Oral Liquid Formulation Template',
    nameCn: 'Oral Liquid Formulation Template',
    unitLabel: 'Vial (10mL)',
    targetWeight: 10000, // 10000mg (10g)
    excipients: [
      { nameCn: 'Purified Water', nameEn: 'Purified Water', type: 'solvent', typicalPct: '80-95%', defaultPct: 85 },
      { nameCn: 'Sorbitol Solution (70%)', nameEn: 'Sorbitol Solution (70%)', type: 'sweetener', typicalPct: '5-15%', defaultPct: 10 },
      { nameCn: 'Citric Acid Anhydrous', nameEn: 'Citric Acid Anhydrous', type: 'pH adjuster', typicalPct: '0.1-0.5%', defaultPct: 0.2 },
      { nameCn: 'Potassium Sorbate', nameEn: 'Potassium Sorbate', type: 'preservative', typicalPct: '0.05-0.15%', defaultPct: 0.1 }
    ]
  },
  powder: {
    name: 'Powder Blend Template',
    nameCn: 'Powder Blend Template',
    unitLabel: 'Sachet (5g)',
    targetWeight: 5000, // 5000mg (5g)
    excipients: [
      { nameCn: 'Anhydrous Dextrose', nameEn: 'Anhydrous Dextrose', type: 'filler', typicalPct: '50-80%', defaultPct: 70 },
      { nameCn: 'Maltodextrin', nameEn: 'Maltodextrin', type: 'filler', typicalPct: '20-40%', defaultPct: 25 },
      { nameCn: 'Sucralose', nameEn: 'Sucralose', type: 'sweetener', typicalPct: '0.05-0.2%', defaultPct: 0.1 }
    ]
  }
};

// Recommended Capsule sizes capacity reference table
export interface CapsuleSpec {
  size: string;
  volume: number; // mL
  typicalCapacityMin: number; // mg (calculated using bulk density 0.6g/mL)
  typicalCapacityMax: number; // mg (calculated using tapped density 0.9g/mL)
}

export const CAPSULE_SPECS: CapsuleSpec[] = [
  { size: '#00', volume: 0.95, typicalCapacityMin: 570, typicalCapacityMax: 855 },
  { size: '#0',  volume: 0.68, typicalCapacityMin: 408, typicalCapacityMax: 612 },
  { size: '#1',  volume: 0.50, typicalCapacityMin: 300, typicalCapacityMax: 450 },
  { size: '#2',  volume: 0.37, typicalCapacityMin: 222, typicalCapacityMax: 333 },
  { size: '#3',  volume: 0.30, typicalCapacityMin: 180, typicalCapacityMax: 270 },
  { size: '#4',  volume: 0.21, typicalCapacityMin: 126, typicalCapacityMax: 189 }
];

// IU ↔ mg conversion factors
export interface IUDictItem {
  nameCn: string;
  nameEn: string;
  iuToMg: number; // 1 IU equals how many milligrams (mg)
  mgToIu: number; // 1 mg equals how many International Units (IU)
}

export const IU_FACTORS: Record<string, IUDictItem> = {
  vitA: {
    nameCn: 'Vitamin A (Retinol)',
    nameEn: 'Vitamin A (Retinol)',
    iuToMg: 0.0003,       // 1 IU = 0.3 μg = 0.0003 mg
    mgToIu: 1 / 0.0003    // 1 mg = 3333.33 IU
  },
  vitD3: {
    nameCn: 'Vitamin D3 (Cholecalciferol)',
    nameEn: 'Vitamin D3 (Cholecalciferol)',
    iuToMg: 0.000025,     // 1 IU = 0.025 μg = 0.000025 mg
    mgToIu: 1 / 0.000025  // 1 mg = 40000 IU
  },
  vitE: {
    nameCn: 'Vitamin E (d-alpha-tocopherol)',
    nameEn: 'Vitamin E (d-alpha-tocopherol)',
    iuToMg: 0.67,         // 1 IU = 0.67 mg
    mgToIu: 1 / 0.67      // 1 mg = 1.49 IU
  }
};
