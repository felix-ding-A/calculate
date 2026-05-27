import React, { useState, useEffect } from 'react';
import { RefreshCw, FileText, AlertTriangle, CheckCircle, Plus, Trash, Settings, BookOpen } from 'lucide-react';
import { SUPPLEMENT_TEMPLATES, CAPSULE_SPECS } from '../utils/supplementData';
import { COSMETIC_TEMPLATES, OIL_HLB_VALUES, EMULSIFIER_HLB, REGULATORY_LIMITS } from '../utils/cosmeticData';

interface PrepStep {
  order: number;
  action: string;
  detail: string;
  volume?: number;
  unit?: string;
}

interface FormulaResult {
  workingConc: number;
  totalVolume: number;
  recommendedVolume: number;
  drugAmount: number;
  dmsoVolume: number;
  stockConc: number;
  solubilityWarning: boolean;
  steps: PrepStep[];
  precautions: string[];
}

interface ActiveIngredient {
  id: string;
  name: string;
  targetContent: string; // mg per unit
  overageRate: string; // %
}

interface CosmeticPhaseIngredient {
  id: string;
  name: string;
  percentage: string;
  type: string;
}

export default function FormulaCalculator() {
  const [activeTab, setActiveTab] = useState<'animal' | 'supplement' | 'cosmetic'>('animal');

  // ==========================================
  // STATE: ANIMAL FORMULATION
  // ==========================================
  const [dose, setDose] = useState<string>('10'); // mg/kg
  const [weight, setWeight] = useState<string>('20'); // g (e.g. mouse)
  const [volumePer, setVolumePer] = useState<string>('100'); // μL per animal
  const [count, setCount] = useState<string>('10'); // animal count
  const [solubilityLimit, setSolubilityLimit] = useState<string>('10'); // mg/mL in DMSO

  // Solvent Percentages (Must sum to 100%)
  const [dmsoPct, setDmsoPct] = useState<string>('10');
  const [pegPct, setPegPct] = useState<string>('40');
  const [tweenPct, setTweenPct] = useState<string>('5');
  const [waterPct, setWaterPct] = useState<string>('45');
  const [cornOilPct, setCornOilPct] = useState<string>('0');

  const [result, setResult] = useState<FormulaResult | null>(null);
  const [pctError, setPctError] = useState<string>('');

  // ==========================================
  // STATE: SUPPLEMENT FORMULATION
  // ==========================================
  const [suppType, setSuppType] = useState<string>('tablet');
  const [suppTargetWeight, setSuppTargetWeight] = useState<string>('500'); // mg
  const [suppBatchSize, setSuppBatchSize] = useState<string>('10000'); // units
  const [suppBulkDensity, setSuppBulkDensity] = useState<string>('0.7'); // g/mL
  const [suppActives, setSuppActives] = useState<ActiveIngredient[]>([
    { id: '1', name: 'Vitamin C', targetContent: '100', overageRate: '5' },
    { id: '2', name: 'Zinc Gluconate', targetContent: '50', overageRate: '2' }
  ]);
  const [suppExcipientPcts, setSuppExcipientPcts] = useState<Record<string, string>>({});

  // ==========================================
  // STATE: COSMETIC FORMULATION
  // ==========================================
  const [cosmeticType, setCosmeticType] = useState<string>('cream');
  const [cosmeticWeight, setCosmeticWeight] = useState<string>('100'); // g
  const [cosmeticPhases, setCosmeticPhases] = useState<Record<string, CosmeticPhaseIngredient[]>>({});

  // Trigger calculations on state changes
  useEffect(() => {
    if (activeTab === 'animal') {
      calculateAnimalFormula();
    }
  }, [dose, weight, volumePer, count, solubilityLimit, dmsoPct, pegPct, tweenPct, waterPct, cornOilPct, activeTab]);

  useEffect(() => {
    if (activeTab === 'supplement') {
      initSupplementExcipients();
    }
  }, [suppType, activeTab]);

  useEffect(() => {
    if (activeTab === 'cosmetic') {
      loadCosmeticTemplate(cosmeticType);
    }
  }, [cosmeticType, activeTab]);

  // ==========================================
  // CALCULATION: ANIMAL FORMULA
  // ==========================================
  const calculateAnimalFormula = () => {
    setPctError('');
    
    const dVal = parseFloat(dose);
    const wVal = parseFloat(weight);
    const vPerVal = parseFloat(volumePer);
    const cVal = parseFloat(count);
    const limitVal = parseFloat(solubilityLimit);

    const dPct = parseFloat(dmsoPct) || 0;
    const pPct = parseFloat(pegPct) || 0;
    const tPct = parseFloat(tweenPct) || 0;
    const wPct = parseFloat(waterPct) || 0;
    const oPct = parseFloat(cornOilPct) || 0;

    const sumPct = dPct + pPct + tPct + wPct + oPct;
    if (Math.abs(sumPct - 100) > 0.01) {
      setPctError(`Solvent percentages must sum up to exactly 100% (currently ${sumPct.toFixed(1)}%)`);
      setResult(null);
      return;
    }

    if (isNaN(dVal) || isNaN(wVal) || isNaN(vPerVal) || isNaN(cVal) || dVal <= 0 || wVal <= 0 || vPerVal <= 0 || cVal <= 0) {
      setResult(null);
      return;
    }

    const drugPerAnimal = (dVal * wVal) / 1000;
    const workingConc = (drugPerAnimal / vPerVal) * 1000;
    const recommendedVolume = vPerVal * (cVal + 1); // in μL
    const theoreticalVolume = vPerVal * cVal;

    const totalVolumeMl = recommendedVolume / 1000;
    const totalDrug = workingConc * totalVolumeMl; // in mg
    const dmsoVolume = recommendedVolume * (dPct / 100); // in μL
    const stockConc = totalDrug / (dmsoVolume / 1000); // in mg/mL

    const solubilityWarning = stockConc > limitVal;
    const steps: PrepStep[] = [];
    let stepOrder = 1;

    steps.push({
      order: stepOrder++,
      action: `Weigh ${totalDrug.toFixed(2)} mg of test compound, and add ${dmsoVolume.toFixed(1)} μL of DMSO.`,
      detail: `Vortex or shake thoroughly to ensure complete dissolution. The stock concentration is now ${stockConc.toFixed(2)} mg/mL.`,
      volume: dmsoVolume,
      unit: 'μL'
    });

    if (pPct > 0) {
      const vol = recommendedVolume * (pPct / 100);
      steps.push({
        order: stepOrder++,
        action: `Add ${vol.toFixed(1)} μL of PEG300.`,
        detail: `Mix until clear. If needed, use a warm water bath, sonication, or vortexing to assist dissolution.`,
        volume: vol,
        unit: 'μL'
      });
    }

    if (tPct > 0) {
      const vol = recommendedVolume * (tPct / 100);
      steps.push({
        order: stepOrder++,
        action: `Add ${vol.toFixed(1)} μL of Tween 80.`,
        detail: `Mix thoroughly to ensure complete solubilization without oil droplets on the tube wall.`,
        volume: vol,
        unit: 'μL'
      });
    }

    if (wPct > 0) {
      const vol = recommendedVolume * (wPct / 100);
      steps.push({
        order: stepOrder++,
        action: `Slowly add ${vol.toFixed(1)} μL of ddH₂O (sterile water).`,
        detail: `Mix continuously while adding water to ensure complete hydration. If precipitation/turbidity occurs, consider increasing solubilizers.`,
        volume: vol,
        unit: 'μL'
      });
    }

    if (oPct > 0) {
      const vol = recommendedVolume * (oPct / 100);
      steps.push({
        order: stepOrder++,
        action: `Add ${vol.toFixed(1)} μL of Corn oil.`,
        detail: `Vortex or shake vigorously to prepare a uniform oil-phase formulation.`,
        volume: vol,
        unit: 'μL'
      });
    }

    setResult({
      workingConc: parseFloat(workingConc.toFixed(4)),
      totalVolume: theoreticalVolume,
      recommendedVolume,
      drugAmount: parseFloat(totalDrug.toFixed(3)),
      dmsoVolume: parseFloat(dmsoVolume.toFixed(1)),
      stockConc: parseFloat(stockConc.toFixed(2)),
      solubilityWarning,
      steps,
      precautions: [
        'Strictly follow the exact order of steps (1, 2, 3...) when adding solvents, otherwise the compound will precipitate.',
        'Ensure the solution is completely clear and mixed after each solvent addition before adding the next one.',
        'It is highly recommended to prepare the formulation fresh before use to avoid degradation or crystallisation.',
        solubilityWarning ? 'Warning: The calculated stock concentration exceeds the specified solubility limit. Increase DMSO percentage or decrease dosage volume.' : 'The calculated stock concentration is within the safe solubility limit.'
      ]
    });
  };

  const setFormulationMode = (mode: 'water' | 'oil') => {
    if (mode === 'water') {
      setDmsoPct('10');
      setPegPct('40');
      setTweenPct('5');
      setWaterPct('45');
      setCornOilPct('0');
    } else {
      setDmsoPct('10');
      setPegPct('0');
      setTweenPct('0');
      setWaterPct('0');
      setCornOilPct('90');
    }
  };

  const handleReset = () => {
    setDose('10');
    setWeight('20');
    setVolumePer('100');
    setCount('10');
    setSolubilityLimit('10');
    setFormulationMode('water');
  };

  // ==========================================
  // CALCULATION: SUPPLEMENT FORMULA
  // ==========================================
  const initSupplementExcipients = () => {
    const template = SUPPLEMENT_TEMPLATES[suppType];
    if (template) {
      setSuppTargetWeight(template.targetWeight.toString());
      const initialPcts: Record<string, string> = {};
      template.excipients.forEach(exc => {
        initialPcts[exc.nameCn] = exc.defaultPct.toString();
      });
      setSuppExcipientPcts(initialPcts);
    }
  };

  const addSuppActive = () => {
    setSuppActives(prev => {
      const nextId = (Math.max(...prev.map(a => parseInt(a.id) || 0), 0) + 1).toString();
      return [...prev, { id: nextId, name: 'New Active Ingredient', targetContent: '50', overageRate: '5' }];
    });
  };

  const updateSuppActive = (id: string, field: keyof ActiveIngredient, value: string) => {
    setSuppActives(prev => prev.map(a => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const removeSuppActive = (id: string) => {
    setSuppActives(prev => prev.filter(a => a.id !== id));
  };

  const updateSuppExcipientPct = (name: string, value: string) => {
    setSuppExcipientPcts(prev => ({ ...prev, [name]: value }));
  };

  // Calculate detailed supplement breakdown
  const getSupplementReport = () => {
    const warnings: string[] = [];
    const targetW = parseFloat(suppTargetWeight) || 500;
    const batchU = parseFloat(suppBatchSize) || 10000;
    const density = parseFloat(suppBulkDensity) || 0.7;

    // 1. Calculate active ingredients actual weight per unit
    let totalActivesActualW = 0;
    const calculatedActives = suppActives.map(a => {
      const targetC = parseFloat(a.targetContent) || 0;
      const overage = parseFloat(a.overageRate) || 0;
      const actualC = targetC * (1 + overage / 100);
      const totalBatchWeightG = (actualC * batchU) / 1000; // in grams
      totalActivesActualW += actualC;

      return {
        ...a,
        actualContent: parseFloat(actualC.toFixed(2)),
        totalBatchWeightG: parseFloat(totalBatchWeightG.toFixed(2))
      };
    });

    // 2. Validate active weight vs total target weight
    const excipientsBudget = targetW - totalActivesActualW;
    let excipientsList: any[] = [];

    if (excipientsBudget < 0) {
      warnings.push(`[Formulation Overload Warning] Total active ingredient content is ${totalActivesActualW.toFixed(1)}mg, which exceeds the target weight of ${targetW}mg. Please increase target unit weight or reduce active ingredient dosage.`);
    } else {
      // Distribute excipients
      const template = SUPPLEMENT_TEMPLATES[suppType];
      if (template) {
        // Read user percentage ratios
        const rawPcts = template.excipients.map(e => parseFloat(suppExcipientPcts[e.nameCn]) || 0);
        const sumRawPcts = rawPcts.reduce((a, b) => a + b, 0);

        excipientsList = template.excipients.map(e => {
          const rawPct = parseFloat(suppExcipientPcts[e.nameCn]) || 0;
          // Normalize percentage so that excipient list distribution is relative
          const relativeShare = sumRawPcts > 0 ? rawPct / sumRawPcts : 1 / template.excipients.length;
          
          const contentPerUnit = excipientsBudget * relativeShare;
          const pctOfTotal = (contentPerUnit / targetW) * 100;
          const totalBatchWeightG = (contentPerUnit * batchU) / 1000;

          return {
            nameCn: e.nameCn,
            nameEn: e.nameEn,
            type: e.type,
            pctOfTotal: parseFloat(pctOfTotal.toFixed(2)),
            contentPerUnit: parseFloat(contentPerUnit.toFixed(2)),
            totalBatchWeightG: parseFloat(totalBatchWeightG.toFixed(2))
          };
        });
      }
    }

    // 3. Recommended Capsule shell size (Only if capsule)
    let capsuleAdvice = '';
    if (suppType === 'capsule') {
      const fillVolumeMl = (targetW / density) / 1000; // mg / (g/mL) / 1000 = mL
      const recommendedCapsule = CAPSULE_SPECS.find(spec => fillVolumeMl <= spec.volume);
      if (recommendedCapsule) {
        capsuleAdvice = `Based on bulk density of ${density} g/mL and unit weight of ${targetW} mg, the calculated fill volume is ${fillVolumeMl.toFixed(3)} mL. Recommended capsule size: ${recommendedCapsule.size} (Volume: ${recommendedCapsule.volume} mL, capacity range: ${recommendedCapsule.typicalCapacityMin}-${recommendedCapsule.typicalCapacityMax} mg).`;
      } else {
        capsuleAdvice = `Calculated fill volume is ${fillVolumeMl.toFixed(3)} mL, which exceeds the capacity of a #00 capsule (0.95 mL). Consider dividing into two capsules or reducing unit weight.`;
      }
    }

    // 4. Tablet disintegration prediction (Only if tablet)
    let tabletAdvice = '';
    if (suppType === 'tablet') {
      const disintegrantItem = excipientsList.find(e => e.type === 'disintegrant');
      const disintegrantPct = disintegrantItem ? disintegrantItem.pctOfTotal : 0;
      
      const estDisintegrationTime = Math.max(5, Math.min(60, parseFloat((45 - disintegrantPct * 8).toFixed(1))));
      tabletAdvice = `Tablet Disintegration Prediction: Disintegrant ratio is ${disintegrantPct.toFixed(1)}%. Estimated disintegration time is ~${estDisintegrationTime} minutes (standard limit is within 30 minutes).`;
    }

    return {
      calculatedActives,
      excipientsList,
      excipientsBudget: parseFloat(excipientsBudget.toFixed(2)),
      capsuleAdvice,
      tabletAdvice,
      warnings,
      totalWeightPerUnit: targetW,
      totalBatchWeightKg: parseFloat(((targetW * batchU) / 1e6).toFixed(3))
    };
  };

  const suppReport = getSupplementReport();

  // ==========================================
  // CALCULATION: COSMETIC FORMULA
  // ==========================================
  const loadCosmeticTemplate = (templateKey: string) => {
    const template = COSMETIC_TEMPLATES[templateKey];
    if (template) {
      setCosmeticWeight(template.targetWeight.toString());
      
      // Map templates to phase component lists
      const mappedPhases: Record<string, CosmeticPhaseIngredient[]> = {};
      Object.entries(template.phases).forEach(([phaseName, ingredients]) => {
        mappedPhases[phaseName] = ingredients.map((ing, idx) => ({
          id: `${phaseName}-${idx}`,
          name: ing.name,
          percentage: ing.percentage.toString(),
          type: ing.type
        }));
      });
      
      // Ensure all 4 phases exist
      ['Phase A (Water Phase)', 'Phase B (Oil Phase / Emulsification)', 'Phase C (Active Ingredients)', 'Phase D (Preservative & Fragrance)'].forEach(p => {
        if (!mappedPhases[p]) mappedPhases[p] = [];
      });

      setCosmeticPhases(mappedPhases);
    }
  };

  const addCosmeticIngredient = (phaseName: string) => {
    setCosmeticPhases(prev => {
      const phaseList = prev[phaseName] || [];
      const nextId = `${phaseName}-${Date.now()}`;
      const newIng: CosmeticPhaseIngredient = { id: nextId, name: 'New Ingredient', percentage: '0', type: 'active' };
      return {
        ...prev,
        [phaseName]: [...phaseList, newIng]
      };
    });
  };

  const updateCosmeticIngredient = (phaseName: string, id: string, field: keyof CosmeticPhaseIngredient, value: string) => {
    setCosmeticPhases(prev => {
      const phaseList = prev[phaseName] || [];
      const updatedList = phaseList.map(ing => (ing.id === id ? { ...ing, [field]: value } : ing));
      return {
        ...prev,
        [phaseName]: updatedList
      };
    });
  };

  const removeCosmeticIngredient = (phaseName: string, id: string) => {
    setCosmeticPhases(prev => {
      const phaseList = prev[phaseName] || [];
      return {
        ...prev,
        [phaseName]: phaseList.filter(ing => ing.id !== id)
      };
    });
  };

  // Real-time Cosmetic Formula Evaluator
  const getCosmeticReport = () => {
    const warnings: string[] = [];
    let totalPct = 0;
    
    // Aggregate all ingredients
    const allIngredients: CosmeticPhaseIngredient[] = [];
    Object.values(cosmeticPhases).forEach(list => {
      list.forEach(ing => {
        totalPct += parseFloat(ing.percentage) || 0;
        allIngredients.push(ing);
      });
    });

    // 1. Regulatory Limit checks
    allIngredients.forEach(ing => {
      const pct = parseFloat(ing.percentage) || 0;
      const ingNameLower = ing.name.toLowerCase();
      
      const limitKey = Object.keys(REGULATORY_LIMITS).find(
        key => ingNameLower.includes(key.toLowerCase()) || ingNameLower.includes(REGULATORY_LIMITS[key].nameCn.toLowerCase())
      );

      if (limitKey) {
        const limitInfo = REGULATORY_LIMITS[limitKey];
        if (pct > limitInfo.maxUsagePct) {
          warnings.push(`[Regulatory Safety Limit] Ingredient [${ing.name}] at ${pct}% exceeds the safety limit of ${limitInfo.maxUsagePct}% (${limitInfo.ref}).`);
        }
      }
    });

    // 2. HLB Required Calculation for Oil Phase
    const oilPhaseIngredients = cosmeticPhases['Phase B (Oil Phase / Emulsification)'] || [];
    let totalOilWeightPct = 0;
    let weightedHlbSum = 0;
    
    oilPhaseIngredients.forEach(ing => {
      const pct = parseFloat(ing.percentage) || 0;
      if (ing.type === 'emollient') {
        const matchedOilKey = Object.keys(OIL_HLB_VALUES).find(
          oilKey => ing.name.toLowerCase().includes(oilKey.toLowerCase().split(' ')[0])
        );
        if (matchedOilKey) {
          const reqHlb = OIL_HLB_VALUES[matchedOilKey];
          weightedHlbSum += reqHlb * pct;
          totalOilWeightPct += pct;
        }
      }
    });

    const requiredHlb = totalOilWeightPct > 0 ? weightedHlbSum / totalOilWeightPct : 0;

    // 3. Emulsifier Blending Solver
    let emulsifierAdvice = '';
    const emulsifiersInPhase = oilPhaseIngredients.filter(ing => ing.type === 'emulsifier');
    
    if (requiredHlb > 0 && emulsifiersInPhase.length >= 2) {
      // Find a high HLB and a low HLB emulsifier
      const highEmulsifier = emulsifiersInPhase.find(ing => {
        const key = Object.keys(EMULSIFIER_HLB).find(k => ing.name.toLowerCase().includes(k.toLowerCase().split(' ')[0]));
        return key && EMULSIFIER_HLB[key] >= 10;
      });
      const lowEmulsifier = emulsifiersInPhase.find(ing => {
        const key = Object.keys(EMULSIFIER_HLB).find(k => ing.name.toLowerCase().includes(k.toLowerCase().split(' ')[0]));
        return key && EMULSIFIER_HLB[key] < 10;
      });

      if (highEmulsifier && lowEmulsifier) {
        const keyHigh = Object.keys(EMULSIFIER_HLB).find(k => highEmulsifier.name.toLowerCase().includes(k.toLowerCase().split(' ')[0]))!;
        const keyLow = Object.keys(EMULSIFIER_HLB).find(k => lowEmulsifier.name.toLowerCase().includes(k.toLowerCase().split(' ')[0]))!;
        
        const hlbHigh = EMULSIFIER_HLB[keyHigh];
        const hlbLow = EMULSIFIER_HLB[keyLow];

        const totalEmulsifierPct = (parseFloat(highEmulsifier.percentage) || 0) + (parseFloat(lowEmulsifier.percentage) || 0);

        if (hlbHigh > hlbLow) {
          const ratioHigh = (requiredHlb - hlbLow) / (hlbHigh - hlbLow);
          const ratioLow = 1 - ratioHigh;

          if (ratioHigh >= 0 && ratioHigh <= 1) {
            const idealHighPct = totalEmulsifierPct * ratioHigh;
            const idealLowPct = totalEmulsifierPct * ratioLow;

            emulsifierAdvice = `Required HLB for oil phase is ${requiredHlb.toFixed(2)}. Blend detected: ${highEmulsifier.name.split(' ')[0]} (HLB ${hlbHigh}) and ${lowEmulsifier.name.split(' ')[0]} (HLB ${hlbLow}). With a total emulsifier percentage of ${totalEmulsifierPct}%, the optimal ratio is: High HLB ${(ratioHigh * 100).toFixed(1)}%, Low HLB ${(ratioLow * 100).toFixed(1)}%.`;
            
            // Expose a helper to autoapply these ratios
            (window as any)._applyOptimalHlb = () => {
              updateCosmeticIngredient('Phase B (Oil Phase / Emulsification)', highEmulsifier.id, 'percentage', idealHighPct.toFixed(2));
              updateCosmeticIngredient('Phase B (Oil Phase / Emulsification)', lowEmulsifier.id, 'percentage', idealLowPct.toFixed(2));
            };
          } else {
            emulsifierAdvice = `Required HLB (${requiredHlb.toFixed(2)}) is outside the range of the emulsifier blend (${hlbLow}-${hlbHigh}). Please use emulsifiers with different HLB values.`;
          }
        }
      }
    }

    // 4. SOP steps generation based on type
    const sopSteps: PrepStep[] = [];
    let orderNum = 1;

    sopSteps.push({
      order: orderNum++,
      action: 'Prepare Reaction Vessel & Homogenizer',
      detail: 'Clean and sanitize mixing vessels and homogenizer. Turn on heating jacket to preheat water/oil phases.'
    });

    if ((cosmeticPhases['Phase A (Water Phase)'] || []).length > 0) {
      sopSteps.push({
        order: orderNum++,
        action: 'Preheat & Mix Phase A (Water Phase)',
        detail: `Add water phase ingredients into the mixing vessel, heat to 75-80°C, and stir until thickeners are fully dissolved and dispersed.`
      });
    }

    if ((cosmeticPhases['Phase B (Oil Phase / Emulsification)'] || []).length > 0) {
      sopSteps.push({
        order: orderNum++,
        action: 'Melt & Preheat Phase B (Oil Phase)',
        detail: `Add oils, emollients, and emulsifiers into the oil vessel. Heat to 75-80°C and mix until completely melted and uniform.`
      });

      sopSteps.push({
        order: orderNum++,
        action: 'Homogenization & Emulsification',
        detail: `At 75-80°C, rapidly add Phase B (Oil Phase) into Phase A (Water Phase). Start the high-shear homogenizer at 3000 rpm and homogenize for 5-10 minutes to form a fine emulsion.`
      });
    }

    sopSteps.push({
      order: orderNum++,
      action: 'Cooling Process',
      detail: 'Stop homogenization and switch to anchor paddle mixing. Slowly cool down to below 40°C.'
    });

    if ((cosmeticPhases['Phase C (Active Ingredients)'] || []).length > 0) {
      sopSteps.push({
        order: orderNum++,
        action: 'Add Phase C (Active Ingredients)',
        detail: 'Add active ingredients at 35-40°C and mix at moderate speed until fully uniform. Avoid adding at high temperatures to prevent active degradation.'
      });
    }

    if ((cosmeticPhases['Phase D (Preservative & Fragrance)'] || []).length > 0) {
      sopSteps.push({
        order: orderNum++,
        action: 'Add Phase D (Preservatives & Fragrances)',
        detail: 'Finally, add preservatives and fragrances. Stir for 10 minutes to ensure homogeneity. Measure pH (ideally weak acidic at 5.5-6.5) before packaging.'
      });
    }

    return {
      totalPct: parseFloat(totalPct.toFixed(2)),
      requiredHlb: parseFloat(requiredHlb.toFixed(2)),
      emulsifierAdvice,
      warnings,
      sopSteps
    };
  };

  const cosmeticReport = getCosmeticReport();

  return (
    <div className="calculator-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="glow-title" style={{ fontSize: '28px', textAlign: 'left' }}>Formulation Solver</h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '14px', textAlign: 'left', marginTop: '4px' }}>
            Interactive recipe builder for in vivo pharmacology, health supplements, and cosmetic emulsions
          </p>
        </div>
        
        {/* Tab Selector */}
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'animal' ? 'active' : ''}`} onClick={() => setActiveTab('animal')}>
            In Vivo Animal Recipe
          </button>
          <button className={`tab-btn ${activeTab === 'supplement' ? 'active' : ''}`} onClick={() => setActiveTab('supplement')}>
            Supplement Formulator
          </button>
          <button className={`tab-btn ${activeTab === 'cosmetic' ? 'active' : ''}`} onClick={() => setActiveTab('cosmetic')}>
            Cosmetic Formulator
          </button>
        </div>
      </div>

      {/* ==========================================
          TAB 1: ANIMAL RECIPE
          ========================================== */}
      {activeTab === 'animal' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Left panel inputs */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label-glass" style={{ fontSize: '14px' }}>Animal Dosage Parameters</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-glass" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setFormulationMode('water')}>Aqueous System Template</button>
                <button className="btn btn-glass" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setFormulationMode('oil')}>Oil System Template</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="label-glass">Dosage per Injection (mg/kg)</label>
                <input type="number" className="input-glass input-glass-mono" value={dose} onChange={(e) => setDose(e.target.value)} />
              </div>
              <div>
                <label className="label-glass">Average Animal Weight (g)</label>
                <input type="number" className="input-glass input-glass-mono" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div>
                <label className="label-glass">Injection Volume per Animal (μL)</label>
                <input type="number" className="input-glass input-glass-mono" value={volumePer} onChange={(e) => setVolumePer(e.target.value)} />
              </div>
              <div>
                <label className="label-glass">Number of Animals</label>
                <input type="number" className="input-glass input-glass-mono" value={count} onChange={(e) => setCount(e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="label-glass">Solubility Limit in DMSO (mg/mL)</label>
                <input type="number" className="input-glass input-glass-mono" value={solubilityLimit} onChange={(e) => setSolubilityLimit(e.target.value)} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '6px' }}>
              <span className="label-glass" style={{ fontSize: '14px', marginBottom: '14px' }}>Solvent Volume Percentages (Must sum to 100%)</span>
              {pctError && <div className="alert-glass alert-glass-danger" style={{ marginBottom: '12px', fontSize: '12px', padding: '8px 12px' }}>{pctError}</div>}
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                <div>
                  <label className="label-glass" style={{ fontSize: '10px' }}>DMSO (%)</label>
                  <input type="number" className="input-glass input-glass-mono" value={dmsoPct} onChange={(e) => setDmsoPct(e.target.value)} />
                </div>
                <div>
                  <label className="label-glass" style={{ fontSize: '10px' }}>PEG300 (%)</label>
                  <input type="number" className="input-glass input-glass-mono" value={pegPct} onChange={(e) => setPegPct(e.target.value)} />
                </div>
                <div>
                  <label className="label-glass" style={{ fontSize: '10px' }}>Tween 80 (%)</label>
                  <input type="number" className="input-glass input-glass-mono" value={tweenPct} onChange={(e) => setTweenPct(e.target.value)} />
                </div>
                <div>
                  <label className="label-glass" style={{ fontSize: '10px' }}>ddH₂O (%)</label>
                  <input type="number" className="input-glass input-glass-mono" value={waterPct} onChange={(e) => setWaterPct(e.target.value)} />
                </div>
                <div>
                  <label className="label-glass" style={{ fontSize: '10px' }}>Corn Oil (%)</label>
                  <input type="number" className="input-glass input-glass-mono" value={cornOilPct} onChange={(e) => setCornOilPct(e.target.value)} />
                </div>
              </div>
            </div>

            <button className="btn btn-glass" style={{ alignSelf: 'flex-start', marginTop: '10px' }} onClick={handleReset}>
              <RefreshCw size={14} /> Reset Recipe
            </button>
          </div>

          {/* Right panel output SOP */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glow-title">
              <FileText size={16} /> Formulation SOP & Preparation Report
            </h3>

            {result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto', maxHeight: '480px' }} className="custom-scrollbar">
                {/* Info summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Working Concentration</span>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>{result.workingConc} mg/mL</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Suggested Prep Vol</span>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--color-primary)' }}>
                      {result.recommendedVolume} μL
                    </p>
                    <span style={{ fontSize: '9px', color: 'var(--color-muted)' }}>(Includes 1 extra animal margin)</span>
                  </div>
                </div>

                {/* Solubility limit checking indicator */}
                {result.solubilityWarning ? (
                  <div className="alert-glass alert-glass-danger" style={{ fontSize: '13px', padding: '10px 14px' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Solubility Alarm:</strong> Stock concentration is <strong>{result.stockConc} mg/mL</strong>, which exceeds solubility limit ({solubilityLimit} mg/mL).
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(5,243,162,0.06)', border: '1px solid rgba(5,243,162,0.2)', borderRadius: '10px', color: 'var(--neon-emerald)', fontSize: '13px' }}>
                    <CheckCircle size={16} />
                    <span>Stock concentration <strong>{result.stockConc} mg/mL</strong> is within safe solubility limit.</span>
                  </div>
                )}

                {/* Steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span className="label-glass" style={{ fontSize: '12px' }}>Step-by-Step Preparation Guide (SOP)</span>
                  {result.steps.map(step => (
                    <div key={step.order} style={{ display: 'flex', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--gradient-cyber)', color: '#000', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
                        {step.order}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-primary)' }}>{step.action}</p>
                        <p style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', fontSize: '13px' }}>
                Please enter valid parameters to generate SOP...
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: SUPPLEMENT FORMULATION
          ========================================== */}
      {activeTab === 'supplement' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Left Inputs */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label-glass" style={{ fontSize: '14px' }}>Active Ingredients & Target Parameters</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  className="input-glass select-glass"
                  style={{ width: '130px', padding: '6px' }}
                  value={suppType}
                  onChange={(e) => setSuppType(e.target.value)}
                >
                  <option value="tablet">Tablet</option>
                  <option value="capsule">Capsule</option>
                  <option value="softgel">Softgel</option>
                  <option value="liquid">Liquid</option>
                  <option value="powder">Powder</option>
                </select>
              </div>
            </div>

            {/* Target Weight & Batch Size */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label className="label-glass">Target Weight per Unit (mg)</label>
                <input
                  type="number"
                  className="input-glass input-glass-mono"
                  value={suppTargetWeight}
                  onChange={(e) => setSuppTargetWeight(e.target.value)}
                />
              </div>
              <div>
                <label className="label-glass">Production Batch Size (Units)</label>
                <input
                  type="number"
                  className="input-glass input-glass-mono"
                  value={suppBatchSize}
                  onChange={(e) => setSuppBatchSize(e.target.value)}
                />
              </div>
              <div>
                <label className="label-glass">Bulk Powder Density (g/mL)</label>
                <input
                  type="number"
                  step="0.05"
                  className="input-glass input-glass-mono"
                  value={suppBulkDensity}
                  onChange={(e) => setSuppBulkDensity(e.target.value)}
                  disabled={suppType !== 'capsule' && suppType !== 'tablet'}
                />
              </div>
            </div>

            {/* Active Ingredients list */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span className="label-glass">Active Ingredients Input</span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 40px', gap: '10px', fontSize: '11px', color: 'var(--color-muted)', paddingLeft: '6px' }}>
                <span>Ingredient Name</span>
                <span>Claimed Content (mg)</span>
                <span>Overage (%)</span>
                <span>Action</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '180px' }} className="custom-scrollbar">
                {suppActives.map(a => (
                  <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 40px', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="input-glass"
                      value={a.name}
                      onChange={(e) => updateSuppActive(a.id, 'name', e.target.value)}
                      placeholder="e.g. Vitamin C"
                    />
                    <input
                      type="number"
                      className="input-glass input-glass-mono"
                      value={a.targetContent}
                      onChange={(e) => updateSuppActive(a.id, 'targetContent', e.target.value)}
                    />
                    <input
                      type="number"
                      className="input-glass input-glass-mono"
                      value={a.overageRate}
                      onChange={(e) => updateSuppActive(a.id, 'overageRate', e.target.value)}
                    />
                    <button
                      onClick={() => removeSuppActive(a.id)}
                      style={{
                        background: 'rgba(255,78,106,0.1)',
                        border: '1px solid rgba(255,78,106,0.2)',
                        borderRadius: '8px',
                        color: 'var(--neon-rose)',
                        cursor: 'pointer',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn btn-glass" style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '12px' }} onClick={addSuppActive}>
                <Plus size={12} style={{ marginRight: '4px' }} /> Add Active Ingredient
              </button>
            </div>

            {/* Excipient Percentage Distribution ratios */}
            {SUPPLEMENT_TEMPLATES[suppType] && (
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span className="label-glass">Relative Distribution of Excipients (Auto-normalized)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {SUPPLEMENT_TEMPLATES[suppType].excipients.map(e => (
                    <div key={e.nameCn} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '6px 12px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>{e.nameCn}</span>
                        <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>{e.type} ({e.typicalPct})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          className="input-glass input-glass-mono"
                          style={{ width: '60px', padding: '4px 6px', fontSize: '12px', textAlign: 'center' }}
                          value={suppExcipientPcts[e.nameCn] || '0'}
                          onChange={(evt) => updateSuppExcipientPct(e.nameCn, evt.target.value)}
                        />
                        <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>pbw</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Output & Report */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glow-title">
              <CheckCircle size={16} /> Supplement Production Formula & SOP
            </h3>

            {suppReport.warnings.map((w, idx) => (
              <div key={idx} className="alert-glass alert-glass-danger" style={{ fontSize: '12px', display: 'flex', gap: '8px', padding: '10px 14px' }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{w}</span>
              </div>
            ))}

            {/* Total specifications card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Target Weight per Unit</span>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>{suppReport.totalWeightPerUnit} mg</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Total Batch weight</span>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                  {suppReport.totalBatchWeightKg} kg
                </p>
                <span style={{ fontSize: '9px', color: 'var(--color-muted)' }}>(Batch size: {suppBatchSize} units)</span>
              </div>
            </div>

            {/* Recommendations (Capsule or Tablet) */}
            {(suppReport.capsuleAdvice || suppReport.tabletAdvice) && (
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(5, 243, 162, 0.04)', border: '1px solid rgba(5, 243, 162, 0.15)', fontSize: '12.5px', color: 'var(--color-primary)', lineHeight: '1.5' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Settings size={16} style={{ color: 'var(--neon-emerald)', marginTop: '2px', flexShrink: 0 }} />
                  <span>{suppReport.capsuleAdvice || suppReport.tabletAdvice}</span>
                </div>
              </div>
            )}

            {/* Ingredient List Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', maxHeight: '300px' }} className="custom-scrollbar">
              <span className="label-glass">Production Material Take-off Sheet (Takeoff Sheet)</span>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                    <th style={{ padding: '6px 4px', color: 'var(--color-muted)' }}>Name / Excipient</th>
                    <th style={{ padding: '6px 4px', color: 'var(--color-muted)' }}>Type</th>
                    <th style={{ padding: '6px 4px', color: 'var(--color-muted)', textAlign: 'right' }}>Per unit (mg)</th>
                    <th style={{ padding: '6px 4px', textAlign: 'right', color: 'var(--neon-cyan)' }}>Batch Total</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Actives */}
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}><td colSpan={4} style={{ padding: '4px 6px', fontSize: '10px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>Active Ingredients</td></tr>
                  {suppReport.calculatedActives.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '6px 4px', fontWeight: '500' }}>{a.name} <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>({a.overageRate}% overage)</span></td>
                      <td style={{ padding: '6px 4px', color: 'var(--color-muted)' }}>Active</td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{a.actualContent} mg</td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)' }}>{a.totalBatchWeightG >= 1000 ? `${(a.totalBatchWeightG/1000).toFixed(3)} kg` : `${a.totalBatchWeightG} g`}</td>
                    </tr>
                  ))}

                  {/* Excipients */}
                  {suppReport.excipientsList.length > 0 && (
                    <>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}><td colSpan={4} style={{ padding: '4px 6px', fontSize: '10px', color: 'var(--neon-emerald)', fontWeight: 'bold' }}>Excipient Blend</td></tr>
                      {suppReport.excipientsList.map(e => (
                        <tr key={e.nameCn} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '6px 4px', fontWeight: '500' }}>{e.nameCn}</td>
                          <td style={{ padding: '6px 4px', color: 'var(--color-muted)' }}>{e.type}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{e.contentPerUnit} mg</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)' }}>{e.totalBatchWeightG >= 1000 ? `${(e.totalBatchWeightG/1000).toFixed(3)} kg` : `${e.totalBatchWeightG} g`}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: COSMETIC FORMULATION
          ========================================== */}
      {activeTab === 'cosmetic' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Left Inputs: Phase Editor */}
          <div className="glass-panel custom-scrollbar" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '680px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label-glass" style={{ fontSize: '14px' }}>Multi-Phase Emulsification Editor</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  className="input-glass select-glass"
                  style={{ width: '130px', padding: '6px' }}
                  value={cosmeticType}
                  onChange={(e) => setCosmeticType(e.target.value)}
                >
                  <option value="serum">Serum</option>
                  <option value="cream">Cream</option>
                  <option value="lotion">Lotion</option>
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    className="input-glass input-glass-mono"
                    style={{ width: '70px', padding: '6px', fontSize: '13px' }}
                    value={cosmeticWeight}
                    onChange={(e) => setCosmeticWeight(e.target.value)}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>g</span>
                </div>
              </div>
            </div>

            {/* Loop through Phase A, B, C, D */}
            {Object.keys(cosmeticPhases).map(phaseName => (
              <div key={phaseName} style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: phaseName.includes('Phase B') ? 'var(--neon-violet)' : 'var(--neon-cyan)' }}>{phaseName}</strong>
                  <button className="btn btn-glass" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => addCosmeticIngredient(phaseName)}>
                    <Plus size={10} style={{ marginRight: '4px' }} /> Add to {phaseName.split(' ')[0]}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {cosmeticPhases[phaseName].map(ing => (
                    <div key={ing.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 40px', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="input-glass"
                        style={{ padding: '5px 8px', fontSize: '12px' }}
                        value={ing.name}
                        onChange={(e) => updateCosmeticIngredient(phaseName, ing.id, 'name', e.target.value)}
                        placeholder="Component name..."
                      />
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          className="input-glass input-glass-mono"
                          style={{ padding: '5px 8px', fontSize: '12px' }}
                          value={ing.percentage}
                          onChange={(e) => updateCosmeticIngredient(phaseName, ing.id, 'percentage', e.target.value)}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>%</span>
                      </div>

                      <select
                        className="input-glass select-glass"
                        style={{ padding: '5px', fontSize: '11px' }}
                        value={ing.type}
                        onChange={(e) => updateCosmeticIngredient(phaseName, ing.id, 'type', e.target.value)}
                      >
                        <option value="solvent">Solvent</option>
                        <option value="humectant">Humectant</option>
                        <option value="thickener">Thickener</option>
                        <option value="emollient">Emollient</option>
                        <option value="emulsifier">Emulsifier</option>
                        <option value="active">Active</option>
                        <option value="preservative">Preservative</option>
                        <option value="fragrance">Fragrance</option>
                        <option value="chelator">Chelator</option>
                      </select>

                      <button
                        onClick={() => removeCosmeticIngredient(phaseName, ing.id)}
                        style={{
                          background: 'rgba(255,78,106,0.1)',
                          border: '1px solid rgba(255,78,106,0.2)',
                          borderRadius: '8px',
                          color: 'var(--neon-rose)',
                          cursor: 'pointer',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Output: Report, HLB engine & SOP */}
          <div className="glass-panel custom-scrollbar" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '680px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glow-title">
              <CheckCircle size={16} /> Cosmetic Formulation Report
            </h3>

            {/* Validation messages */}
            {cosmeticReport.warnings.map((w, idx) => (
              <div key={idx} className="alert-glass alert-glass-danger" style={{ fontSize: '12px', display: 'flex', gap: '8px', padding: '10px 14px' }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{w}</span>
              </div>
            ))}

            {/* Percentage Sum verify */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: Math.abs(cosmeticReport.totalPct - 100) > 0.01 ? 'rgba(255,78,106,0.06)' : 'rgba(5,243,162,0.06)', border: Math.abs(cosmeticReport.totalPct - 100) > 0.01 ? '1px solid rgba(255,78,106,0.2)' : '1px solid rgba(5,243,162,0.2)', borderRadius: '10px', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-primary)' }}>Total Formulation Ratio (Phase A+B+C+D):</span>
              <strong style={{ color: Math.abs(cosmeticReport.totalPct - 100) > 0.01 ? 'var(--neon-rose)' : 'var(--neon-emerald)' }}>{cosmeticReport.totalPct} %</strong>
            </div>

            {/* HLB Solver panel */}
            {cosmeticReport.requiredHlb > 0 && (
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(161, 84, 255, 0.04)', border: '1px solid rgba(161, 84, 255, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neon-violet)' }}>Oil Phase Required HLB Solver</span>
                  <span className="input-glass-mono" style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '12px', background: 'rgba(0,0,0,0.2)', color: 'var(--neon-cyan)' }}>
                    Req. HLB: {cosmeticReport.requiredHlb}
                  </span>
                </div>
                
                {cosmeticReport.emulsifierAdvice ? (
                  <>
                    <p style={{ fontSize: '12px', color: 'var(--color-secondary)', lineHeight: '1.5' }}>
                      {cosmeticReport.emulsifierAdvice}
                    </p>
                    <button
                      className="btn btn-glass"
                      style={{ fontSize: '11px', padding: '6px 10px', alignSelf: 'flex-start', color: 'var(--neon-violet)' }}
                      onClick={() => {
                        if (typeof (window as any)._applyOptimalHlb === 'function') {
                          (window as any)._applyOptimalHlb();
                        }
                      }}
                    >
                      Apply Optimal HLB Balance
                    </button>
                  </>
                ) : (
                  <p style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                    Tip: Add a high HLB emulsifier (e.g. Tween 80) and a low HLB emulsifier (e.g. Span 80) in Phase B to activate automatic ratio optimization.
                  </p>
                )}
              </div>
            )}

            {/* SOP details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="label-glass" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={13} /> Formulation SOP & Processing Guidelines</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cosmeticReport.sopSteps.map(step => (
                  <div key={step.order} style={{ display: 'flex', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(161, 84, 255, 0.2)', color: 'var(--neon-violet)', fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>
                      {step.order}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{step.action}</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-secondary)', lineHeight: '1.4' }}>{step.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Material weight table */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="label-glass">Required Raw Material Weight Chart ({cosmeticWeight} g Sample)</span>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                    <th style={{ padding: '6px 4px', color: 'var(--color-muted)' }}>Ingredient Name</th>
                    <th style={{ padding: '6px 4px', color: 'var(--color-muted)' }}>Phase / Function</th>
                    <th style={{ padding: '6px 4px', color: 'var(--color-muted)', textAlign: 'right' }}>Ratio (%)</th>
                    <th style={{ padding: '6px 4px', textAlign: 'right', color: 'var(--neon-cyan)' }}>Batch Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(cosmeticPhases).map(([phaseName, list]) => {
                    if (list.length === 0) return null;
                    return (
                      <React.Fragment key={phaseName}>
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <td colSpan={4} style={{ padding: '4px 6px', fontSize: '10px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>{phaseName}</td>
                        </tr>
                        {list.map(ing => {
                          const pct = parseFloat(ing.percentage) || 0;
                          const totalW = parseFloat(cosmeticWeight) || 100;
                          const weightG = (pct * totalW) / 100;
                          return (
                            <tr key={ing.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '6px 4px', fontWeight: '500' }}>{ing.name}</td>
                              <td style={{ padding: '6px 4px', color: 'var(--color-muted)' }}>{ing.type}</td>
                              <td style={{ padding: '6px 4px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{pct}%</td>
                              <td style={{ padding: '6px 4px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)' }}>{weightG.toFixed(3)} g</td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
