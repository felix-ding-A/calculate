# Selleck.cn 配方计算器分析 & 保健品/化妆品配方计算系统开发文档

---

## 目录

1. [项目概述](#1-项目概述)
2. [计算器功能映射分析](#2-计算器功能映射分析)
3. [计算器一：摩尔浓度计算器](#3-计算器一摩尔浓度计算器)
4. [计算器二：稀释计算器](#4-计算器二稀释计算器)
5. [计算器三：分子量计算器](#5-计算器三分子量计算器)
6. [计算器四：配方配制计算器](#6-计算器四配方配制计算器)
7. [技术架构设计](#7-技术架构设计)
8. [数据库设计](#8-数据库设计)
9. [API 接口设计](#9-api-接口设计)
10. [前端组件设计](#10-前端组件设计)
11. [保健品/化妆品专属增强功能](#11-保健品化妆品专属增强功能)

---

## 1. 项目概述

### 1.1 项目背景

Selleck.cn 是生命科学活性化合物供应商，其网站集成了 4 个科研实验计算器。本项目旨在分析这些计算器的底层实现逻辑，并将其改造为适用于**保健品配方**和**化妆品配方**开发场景的专业计算系统。

### 1.2 Selleck 计算器清单

| 序号 | 计算器名称 | URL | 核心功能 |
|------|----------|-----|---------|
| 1 | 摩尔浓度计算器 | `/molaritycalculator.jsp` | 质量-浓度-体积-分子量四元互算 |
| 2 | 稀释计算器 | `/dilutioncalculator.jsp` | C₁V₁=C₂V₂ 稀释配比 + 连续稀释梯度 |
| 3 | 分子量计算器 | `/molecular-weight-calculator.html` | 化学式解析 → 分子量自动计算 |
| 4 | 动物体内配方计算器 | `/calculator.jsp` | 多溶剂配方分步配制方案 |

### 1.3 与保健品/化妆品配方的关联

```
selleck 动物实验         →  保健品/化妆品场景
─────────────────────────────────────────────
给药剂量 (mg/kg)        →  活性成分推荐日剂量
动物体重 (g)            →  人用单次剂量
给药体积 (μL)           →  单粒/单次用量
DMSO母液 (mg/μL)        →  浓缩液/提取物浓度
多溶剂配方 (%)          →  乳化体系/精华液配方
连续稀释梯度            →  功效成分剂量梯度测试
```

---

## 2. 计算器功能映射分析

### 2.1 保健品配方适用场景

```
保健品配方开发流程
┌─────────────────────────────────────────────────┐
│  原料筛选                                       │
│    ↓                                            │
│  活性成分定量 ───→ 摩尔浓度计算器               │
│    ↓                                            │
│  辅料配比     ───→ 配方配制计算器               │
│    ↓                                            │
│  含量均一性   ───→ 稀释计算器 (梯度验证)       │
│    ↓                                            │
│  分子量确认   ───→ 分子量计算器                 │
└─────────────────────────────────────────────────┘
```

| 保健品典型需求 | 对应计算器 | 适配改造 |
|-------------|----------|---------|
| 维生素C 每片含量计算 | 摩尔浓度计算器 | 单位改为 mg/片 |
| 草本提取物标准化稀释 | 稀释计算器 | 增加"提取比例"参数 |
| 活性肽分子量确认 | 分子量计算器 | 内置保健品常见成分库 |
| 软胶囊内容物配方 | 配方配制计算器 | 溶剂→植物油/甘油/蜂蜡 |
| 口服液多成分复配 | 配方配制计算器 | 多活性成分并行计算 |

### 2.2 化妆品配方适用场景

```
化妆品配方开发流程
┌─────────────────────────────────────────────────┐
│  活性物筛选                                    │
│    ↓                                           │
│  有效浓度计算 ───→ 摩尔浓度计算器              │
│    ↓                                           │
│  乳化体系配比 ───→ 配方配制计算器              │
│    ↓                                           │
│  防腐劑浓度验证 ──→ 稀释计算器                 │
│    ↓                                           │
│  功效成分分子量 ──→ 分子量计算器               │
└─────────────────────────────────────────────────┘
```

| 化妆品典型需求 | 对应计算器 | 适配改造 |
|-------------|----------|---------|
| 精华液活性物浓度 (%w/w) | 摩尔浓度计算器 | 输出重量百分比 |
| 香精/精油稀释配比 | 稀释计算器 | 增加 IFRA 合规校验 |
| 乳化剂 HLB 计算 | 配方配制计算器 | 增加 HLB 值数据库 |
| 防腐剂有效浓度校验 | 稀释计算器 | 内置法规上限预警 |
| 防晒剂复配比例 | 配方配制计算器 | 增加 SPF/PA 估算 |

---

## 3. 计算器一：摩尔浓度计算器

### 3.1 功能描述

计算溶质质量、溶液浓度、溶液体积、溶质分子量四个参数中任意三个已知量求第四个。

### 3.2 核心公式

```
质量(mg) = 浓度(mM) × 体积(mL) × 分子量(g/mol)
```

**推导过程：**

```
摩尔数 n = m / M           (m=质量, M=分子量)
浓度 C  = n / V            (n=摩尔数, V=体积)

→ C = m / (M × V)
→ m = C × M × V

单位统一（毫级）：
m(mg) = C(mM) × M(g/mol) × V(mL)
```

### 3.3 单位换算逻辑

```
质量: pg(10⁻¹²g) < ng(10⁻⁹) < μg(10⁻⁶) < mg(10⁻³) < g < kg(10³)
浓度: fM(10⁻¹⁵) < pM(10⁻¹²) < nM(10⁻⁹) < μM(10⁻⁶) < mM(10⁻³) < M
体积: nL(10⁻⁹L) < μL(10⁻⁶) < mL(10⁻³) < L

统一基准单位: mg, mM, mL, g/mol
```

```javascript
// 核心计算逻辑伪代码
function molarityCalculator(params) {
  const { mass, massUnit, conc, concUnit, volume, volumeUnit, mw } = params;

  // 统一换算到基准单位 (mg, mM, mL, g/mol)
  const massInMg   = mass   * MASS_UNIT_FACTORS[massUnit];    // → mg
  const concInMm   = conc   * CONC_UNIT_FACTORS[concUnit];    // → mM
  const volumeInMl = volume * VOL_UNIT_FACTORS[volumeUnit];   // → mL

  // 判断缺失参数并计算
  if (mass === null) {
    // 求质量: m = C × V × M
    const massMg = concInMm * volumeInMl * mw;
    return { result: massMg / MASS_UNIT_FACTORS[massUnit], unit: massUnit };
  }
  if (conc === null) {
    // 求浓度: C = m / (V × M)
    const concMm = massInMg / (volumeInMl * mw);
    return { result: concMm / CONC_UNIT_FACTORS[concUnit], unit: concUnit };
  }
  if (volume === null) {
    // 求体积: V = m / (C × M)
    const volumeMl = massInMg / (concInMm * mw);
    return { result: volumeMl / VOL_UNIT_FACTORS[volumeUnit], unit: volumeUnit };
  }
  if (mw === null) {
    // 求分子量: M = m / (C × V)
    const molecularWeight = massInMg / (concInMm * volumeInMl);
    return { result: molecularWeight, unit: 'g/mol' };
  }
}
```

### 3.4 单位换算因子表

```javascript
const MASS_UNITS = {
  'pg': 1e-9,    // 皮克 → 毫克
  'ng': 1e-6,    // 纳克 → 毫克
  'μg': 1e-3,    // 微克 → 毫克
  'mg': 1,       // 毫克（基准）
  'g':  1e3,     // 克 → 毫克
  'kg': 1e6      // 千克 → 毫克
};

const CONC_UNITS = {
  'fM': 1e-12,   // 飞摩尔 → 毫摩尔
  'pM': 1e-9,    // 皮摩尔 → 毫摩尔
  'nM': 1e-6,    // 纳摩尔 → 毫摩尔
  'μM': 1e-3,    // 微摩尔 → 毫摩尔
  'mM': 1,       // 毫摩尔（基准）
  'M':  1e3      // 摩尔 → 毫摩尔
};

const VOL_UNITS = {
  'nL': 1e-6,    // 纳升 → 毫升
  'μL': 1e-3,    // 微升 → 毫升
  'mL': 1,       // 毫升（基准）
  'L':  1e3      // 升 → 毫升
};
```

### 3.5 保健品/化妆品改造方案

```
原始: 质量(mg) = 浓度(mM) × 体积(mL) × 分子量
改造: 活性物质量(g) = 配方百分比(%) × 总重(g)

新增模式:
  - 重量百分比模式: % (w/w)
  - 体积百分比模式: % (v/v)
  - 国际单位换算: IU ↔ mg (需内置转换因子库)
```

---

## 4. 计算器二：稀释计算器

### 4.1 功能描述

提供两个子模块：
- **标准稀释**: C₁V₁ = C₂V₂，任意三个参数求第四个
- **连续稀释**: 从初始浓度开始，按固定倍数连续稀释产生 8 个梯度

### 4.2 核心公式

#### 标准稀释

```
C₁ × V₁ = C₂ × V₂

其中:
  C₁: 初始浓度
  V₁: 初始体积
  C₂: 目标浓度
  V₂: 目标体积
```

物理意义：稀释前后溶质总量守恒。

#### 连续稀释（梯度稀释）

```
C₁ = C₀ / X
C₂ = C₁ / X = C₀ / X²
C₃ = C₂ / X = C₀ / X³
...
Cₙ = C₀ / Xⁿ

LOG(Cₙ) = LOG(C₀) - n × LOG(X)
```

### 4.3 实现逻辑

```javascript
// 标准稀释计算
function dilutionCalculator(c1, c1Unit, v1, v1Unit, c2, c2Unit, v2, v2Unit) {
  // 统一浓度单位到同一量级
  const c1Norm = c1 * CONC_UNITS[c1Unit];  // → mM
  const c2Norm = c2 * CONC_UNITS[c2Unit];  // → mM

  // 统一体积单位
  const v1Norm = v1 * VOL_UNITS[v1Unit];   // → mL
  const v2Norm = v2 * VOL_UNITS[v2Unit];   // → mL

  // 根据缺失参数计算
  // ...
}

// 连续稀释计算
function serialDilution(c0, dilutionFactor, steps = 8) {
  const results = [];
  for (let i = 1; i <= steps; i++) {
    const cn = c0 / Math.pow(dilutionFactor, i);
    results.push({
      label: `C${i}`,
      concentration: cn,
      logConcentration: Math.log10(cn)
    });
  }
  return results;
}
```

### 4.4 连续稀释输出结构

| 梯度 | 浓度值 | LOG值 | 实际应用 |
|------|--------|-------|---------|
| C1 | C₀ / X | log₁₀(C₁) | 最高测试浓度 |
| C2 | C₀ / X² | log₁₀(C₂) | 中高浓度 |
| C3 | C₀ / X³ | log₁₀(C₃) | 中等浓度 |
| C4 | C₀ / X⁴ | log₁₀(C₄) | 中低浓度 |
| C5 | C₀ / X⁵ | log₁₀(C₅) | 低浓度 |
| C6 | C₀ / X⁶ | log₁₀(C₆) | 极低浓度 |
| C7 | C₀ / X⁷ | log₁₀(C₇) | 痕量浓度 |
| C8 | C₀ / X⁸ | log₁₀(C₈) | 最低浓度 |

> **LOG 值的作用**: 方便在半对数坐标纸上绘制标准曲线，用于 ELISA、IC₅₀ 等实验。

### 4.5 保健品/化妆品改造方案

```
标准稀释 → 配方放大/缩小计算
  - 实验室小样 → 中试 → 量产 逐级放大
  - 按放大倍数自动计算各原料用量

连续稀释 → 功效成分剂量梯度
  - 化妆品: 活性物 0.1%~10% 的系列配方
  - 保健品: 人体推荐量 50%~200% 的验证区间

新增功能:
  - IFRA 标准自动校验 (香精香料限值)
  - 防腐剂法规上限预警 (如 MIT < 0.01%)
  - 放大因子输入: 100g(小样) → 1kg(中试) → 100kg(量产)
```

---

## 5. 计算器三：分子量计算器

### 5.1 功能描述

用户输入化学式（如 `C10H16N2O2`），系统自动解析并计算分子量。

### 5.2 核心算法

```
分子量 = Σ(元素原子量 × 原子个数)
```

### 5.3 化学式解析算法

```
输入: "C10H16N2O2"

解析步骤:
1. 扫描字符，分词为 Token 序列
   输入: C 1 0 H 1 6 N 2 O 2
   Token: [C,10], [H,16], [N,2], [O,2]

2. 解析规则:
   - 大写字母 = 新元素开始
   - 紧跟的小写字母 = 同一元素 (如 Na, Fe, Mg)
   - 紧跟的数字 = 该元素原子个数
   - 无数字 = 默认 1 个原子
   - 括号支持: Ca(OH)2 → Ca:1, O:2, H:2
   - 水合物: CuSO4·5H2O → 解析点号分隔符

3. 查表计算:
   C: 10 × 12.011 = 120.110
   H: 16 × 1.008  = 16.128
   N: 2  × 14.007 = 28.014
   O: 2  × 15.999 = 31.998
   总计 = 196.250 g/mol
```

### 5.4 实现代码

```javascript
// 原子量数据库
const ATOMIC_WEIGHTS = {
  'H':  1.008,   'He': 4.0026,  'Li': 6.94,    'Be': 9.0122,
  'B':  10.81,   'C':  12.011,  'N':  14.007,  'O':  15.999,
  'F':  18.998,  'Ne': 20.180,  'Na': 22.990,  'Mg': 24.305,
  'Al': 26.982,  'Si': 28.085,  'P':  30.974,  'S':  32.06,
  'Cl': 35.45,   'K':  39.098,  'Ca': 40.078,  'Fe': 55.845,
  'Cu': 63.546,  'Zn': 65.38,   'Se': 78.971,  'I':  126.90,
  // ... 完整 118 元素周期表
};

/**
 * 解析化学式并计算分子量
 * 支持格式:
 *   C10H16N2O2          (基础格式)
 *   Na2CO3              (双字母元素)
 *   Ca(OH)2             (括号 + 下标)
 *   CuSO4·5H2O          (水合物)
 *   2KCl·MgCl2·6H2O     (复盐/水合物)
 */
function parseFormula(formula) {
  // 去除空格，统一为大写首字母
  formula = formula.trim();

  // 使用正则分词
  // 匹配: 元素符号 [A-Z][a-z]? 或 左括号 ( 或 右括号 ) 或 数字 或 点号 ·
  const tokens = formula.match(/[A-Z][a-z]?|\(|\)|\d+(\.\d+)?|·/g) || [];

  const stack = [{}];  // 元素计数栈，支持括号嵌套
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token === '(') {
      stack.push({});  // 推入新的计数层
    } else if (token === ')') {
      const group = stack.pop();
      // 检查右括号后是否有下标数字
      let multiplier = 1;
      if (i + 1 < tokens.length && /^\d+(\.\d+)?$/.test(tokens[i + 1])) {
        multiplier = parseFloat(tokens[i + 1]);
        i++;
      }
      // 将组内计数乘以下标合并到上一层
      const parent = stack[stack.length - 1];
      for (const [elem, count] of Object.entries(group)) {
        parent[elem] = (parent[elem] || 0) + count * multiplier;
      }
    } else if (token === '·') {
      // 水合物分隔符，忽略，继续解析
    } else if (/^[A-Z]/.test(token)) {
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

  const elementCounts = stack[0];

  // 计算总分子量
  let totalMW = 0;
  for (const [element, count] of Object.entries(elementCounts)) {
    if (!ATOMIC_WEIGHTS[element]) {
      throw new Error(`未知元素: ${element}`);
    }
    totalMW += ATOMIC_WEIGHTS[element] * count;
  }

  return {
    molecularWeight: Math.round(totalMW * 1000) / 1000,  // 保留3位小数
    composition: elementCounts,
    formula: formula
  };
}

// 使用示例
parseFormula('C10H16N2O2');
// → { molecularWeight: 196.25, composition: {C:10, H:16, N:2, O:2}, ... }
parseFormula('Ca(OH)2');
// → { molecularWeight: 74.093, composition: {Ca:1, O:2, H:2}, ... }
```

### 5.5 保健品/化妆品改造方案

```
核心改造: 内置保健品/化妆品常见成分分子量数据库
  - 维生素系列: 维C(176.12), 维E(430.71), 维A(286.45)...
  - 防腐剂: 苯氧乙醇(138.16), 山梨酸钾(150.22)...
  - 防晒剂: 奥克立林(361.48), 阿伏苯宗(310.39)...
  - 活性肽: 乙酰基六肽-8, 棕榈酰五肽-4...
  - 植物提取标志物: 甘草酸(822.93), 积雪草苷(959.12)...

新增功能:
  1. 快捷搜索: 输入"维生素C" → 自动填充 C6H8O6
  2. 批量计算: 一次输入多个成分的化学式
  3. 百分比组成: 输入配方百分比 → 计算各成分摩尔比
```

---

## 6. 计算器四：配方配制计算器

### 6.1 功能描述

这是最复杂的一个计算器，用于设计多溶剂体系的配方方案。用户输入实验参数和溶剂百分比，系统输出分步骤的配制操作指引。

### 6.2 输入参数

#### 第一步：基本参数

| 参数 | 单位 | 符号 | 说明 |
|------|------|------|------|
| 给药剂量 | mg/kg | `dose` | 每公斤体重的活性物用量 |
| 动物平均体重 | g | `weight` | 实验对象平均体重 |
| 每只给药体积 | μL | `volumePer` | 每次给药液体体积 |
| 动物数量 | 只 | `count` | 实验动物总数 |

#### 第二步：配方组成（两种模式）

**模式 A — 水相复合体系：**

| 组分 | 输入 | 作用 |
|------|------|------|
| DMSO % | 百分比 | 药物母液溶剂 |
| PEG300 % | 百分比 | 助溶剂 |
| Tween 80 % | 百分比 | 表面活性剂 |
| ddH₂O % | 百分比 | 水相载体 |

**模式 B — 油相体系：**

| 组分 | 输入 | 作用 |
|------|------|------|
| DMSO % | 百分比 | 药物母液溶剂 |
| Corn oil % | 百分比 | 油相载体 |

### 6.3 计算逻辑推导

```
第 1 步 — 计算工作液浓度:
  每只动物需药量 (mg) = dose (mg/kg) × weight (g) / 1000
  工作液浓度 (mg/mL) = 每只需药量 (mg) / volumePer (μL) × 1000

第 2 步 — 计算总液量:
  总液量 (μL) = volumePer × count
  建议多加一只: 总液量 = volumePer × (count + 1)

第 3 步 — DMSO母液配制:
  总药物量 (mg) = 工作液浓度 (mg/mL) × 总液量 (mL) × DMSO%
  DMSO体积 (μL) = 总液量 (μL) × DMSO%
  母液浓度 (mg/mL) = 总药物量 (mg) / DMSO体积 (mL)

第 4 步 — 配方步骤:
  按顺序计算每种溶剂的加入体积:
    V_PEG300 = 总液量 × PEG300%
    V_Tween80 = 总液量 × Tween80%
    V_ddH2O = 总液量 × ddH2O%

第 5 步 — 溶解度校验:
  若 母液浓度 > 该药物DMSO溶解度上限 → 警告提示
```

### 6.4 完整计算代码

```javascript
/**
 * 配方配制计算器
 * @param {Object} params
 * @returns {Object} 完整配方方案
 */
function formulaCalculator(params) {
  const {
    dose,         // mg/kg
    weight,       // g
    volumePer,    // μL
    count,        // 只
    dmsoPct,      // DMSO百分比 (0-100)
    peg300Pct,    // PEG300百分比 (0-100) (可为0表示模式B)
    tween80Pct,   // Tween80百分比 (0-100) (可为0)
    ddwaterPct,   // ddH2O百分比 (0-100) (可为0)
    cornOilPct,   // Corn oil百分比 (0-100) (可为0)
    drugSolubilityLimit, // 该药物在DMSO中的溶解度上限 (mg/mL)
  } = params;

  // === 验证百分比总和 ===
  const totalPct = dmsoPct + peg300Pct + tween80Pct + ddwaterPct + cornOilPct;
  if (Math.abs(totalPct - 100) > 0.01) {
    throw new Error('配方百分比之和必须为 100%');
  }

  // === 第 1 步: 计算工作液浓度 ===
  const drugPerAnimal = dose * weight / 1000;   // mg
  const workingConc = drugPerAnimal / volumePer * 1000;  // mg/mL

  // === 第 2 步: 计算总液量 (多配一只) ===
  const totalVolume = volumePer * (count + 1);   // μL
  const totalVolumeMl = totalVolume / 1000;       // mL

  // === 第 3 步: 母液配制 ===
  const totalDrug = workingConc * totalVolumeMl;  // mg (总药物量)
  const dmsoVolume = totalVolume * dmsoPct / 100; // μL (DMSO体积)
  const stockConc = totalDrug / (dmsoVolume / 1000); // mg/mL (母液浓度)

  // === 第 4 步: 溶解度校验 ===
  const solubilityWarning = stockConc > drugSolubilityLimit;

  // === 第 5 步: 各溶剂加入量 ===
  const steps = [];

  // DMSO母液
  steps.push({
    order: 1,
    action: `取 ${dmsoVolume.toFixed(1)} μL DMSO 溶解 ${totalDrug.toFixed(2)} mg 药物`,
    detail: `制备母液，浓度: ${stockConc.toFixed(2)} mg/mL`,
    volume: dmsoVolume,
    unit: 'μL'
  });

  // 模式 A: PEG300 + Tween80 + ddH2O
  if (peg300Pct > 0) {
    const pegVol = totalVolume * peg300Pct / 100;
    steps.push({
      order: steps.length + 1,
      action: `加入 ${pegVol.toFixed(1)} μL PEG300`,
      detail: '混匀至澄清（可涡旋/超声/水浴加热）',
      volume: pegVol,
      unit: 'μL'
    });
  }

  if (tween80Pct > 0) {
    const tweenVol = totalVolume * tween80Pct / 100;
    steps.push({
      order: steps.length + 1,
      action: `加入 ${tweenVol.toFixed(1)} μL Tween 80`,
      detail: '混匀至澄清',
      volume: tweenVol,
      unit: 'μL'
    });
  }

  if (ddwaterPct > 0) {
    const waterVol = totalVolume * ddwaterPct / 100;
    steps.push({
      order: steps.length + 1,
      action: `加入 ${waterVol.toFixed(1)} μL ddH₂O`,
      detail: '混匀至澄清',
      volume: waterVol,
      unit: 'μL'
    });
  }

  // 模式 B: Corn oil
  if (cornOilPct > 0) {
    const oilVol = totalVolume * cornOilPct / 100;
    steps.push({
      order: steps.length + 1,
      action: `加入 ${oilVol.toFixed(1)} μL Corn oil`,
      detail: '混匀至澄清',
      volume: oilVol,
      unit: 'μL'
    });
  }

  // === 第 6 步: 汇总结果 ===
  return {
    workingConcentration: {
      value: workingConc,
      unit: 'mg/mL',
      formula: `${dose} mg/kg × ${weight} g / 1000 / ${volumePer} × 1000 μL`
    },
    stockSolution: {
      drugAmount: totalDrug,          // mg
      dmsoAmount: dmsoVolume,         // μL
      concentration: stockConc,       // mg/mL
      warning: solubilityWarning ? {
        message: `母液浓度 ${stockConc.toFixed(2)} mg/mL 可能超过该药物在DMSO中的溶解度上限 ${drugSolubilityLimit} mg/mL`,
        suggestion: '请联系供应商确认溶解度，或增加DMSO比例'
      } : null
    },
    totalVolume: {
      theoretical: volumePer * count,    // μL
      recommended: totalVolume,          // μL (含余量)
      note: '已包含一只动物的余量'
    },
    preparationSteps: steps,
    formulationMode: cornOilPct > 0 ? 'B (油相体系)' : 'A (水相体系)',
    precautions: [
      '确保母液完全澄清后再进行下一步',
      '必须按照顺序依次加入溶剂',
      '每一步都需确认溶液澄清',
      '必要时使用涡旋、超声或水浴加热助溶'
    ]
  };
}
```

### 6.5 保健品场景改造

```javascript
/**
 * 保健品配方计算器 - 改造方案
 *
 * 原始: 动物给药 → 改造: 人用保健品
 * ┌──────────────────────────────────────────────────────────┐
 * │                                                          │
 * │  输入参数改造:                                           │
 * │    dose      → 日推荐摄入量 (RDI) 或 单片含量            │
 * │    weight    → 去掉（人不按体重给药）                    │
 * │    volumePer → 单片/单粒净含量 (mg/片)                   │
 * │    count     → 生产批次量 (片)                           │
 * │                                                          │
 * │  溶剂体系改造:                                           │
 * │    DMSO      → 填充剂 (微晶纤维素/淀粉)                  │
 * │    PEG300    → 粘合剂 (聚维酮/羟丙甲纤维素)              │
 * │    Tween 80  → 崩解剂 (交联羧甲基纤维素钠)               │
 * │    ddH2O     → 润滑剂 (硬脂酸镁)                         │
 * │    Corn oil  → 软胶囊内容物 (植物油/鱼油)                │
 * │                                                          │
 * │  新增参数:                                               │
 * │    - 剂型选择: 片剂/胶囊/口服液/软胶囊/粉剂             │
 * │    - 辅料占比: 填充剂:粘合剂:崩解剂:润滑剂 = ?:?:?:?   │
 * │    - 片重规格: 250mg/500mg/1000mg                       │
 * │    - 含量规格: 标识含量 vs 投料量 (考虑损耗)            │
 * │                                                          │
 * └──────────────────────────────────────────────────────────┘
 */

// 保健品辅料模板数据库
const SUPPLEMENT_TEMPLATES = {
  'tablet': {  // 片剂
    name: '片剂标准配方模板',
    excipients: [
      { name: '微晶纤维素 (MCC)', type: 'filler',    typicalPct: '30-60%' },
      { name: '聚维酮 K30',       type: 'binder',    typicalPct: '2-5%'  },
      { name: '交联CMC-Na',       type: 'disintegrant', typicalPct: '2-5%' },
      { name: '硬脂酸镁',         type: 'lubricant', typicalPct: '0.5-1%' },
      { name: '二氧化硅',         type: 'glidant',   typicalPct: '0.5-1%' },
    ],
    targetWeight: 500, // mg/片
  },
  'capsule': {  // 硬胶囊
    name: '硬胶囊标准配方模板',
    excipients: [
      { name: '预胶化淀粉', type: 'filler', typicalPct: '40-60%' },
      { name: '硬脂酸镁',   type: 'lubricant', typicalPct: '0.5-1%' },
    ],
    targetWeight: 400,
  },
  'softgel': {  // 软胶囊
    name: '软胶囊内容物配方模板',
    excipients: [
      { name: '大豆油',   type: 'carrier', typicalPct: '60-90%' },
      { name: '蜂蜡',     type: 'suspending', typicalPct: '3-8%' },
      { name: '大豆卵磷脂', type: 'emulsifier', typicalPct: '1-3%' },
    ],
    targetWeight: 1000,
  },
  'liquid': {  // 口服液
    name: '口服液配方模板',
    excipients: [
      { name: '纯化水',      type: 'solvent', typicalPct: '80-95%' },
      { name: '山梨糖醇',    type: 'sweetener', typicalPct: '5-15%' },
      { name: '柠檬酸',      type: 'pH adjuster', typicalPct: '0.1-1%' },
      { name: '山梨酸钾',    type: 'preservative', typicalPct: '0.05-0.1%' },
    ],
    targetWeight: 10000, // mg/支(10mL)
  }
};
```

### 6.6 化妆品场景改造

```javascript
/**
 * 化妆品配方计算器 - 改造方案
 *
 * 原始: 动物给药 → 改造: 化妆品多相乳化体系
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │                                                          │
 * │  输入参数改造:                                           │
 * │    dose      → 活性物有效浓度 (% w/w)                    │
 * │    weight    → 去掉                                       │
 * │    volumePer → 单瓶装量 (g/mL)                           │
 * │    count     → 生产批次量 (kg)                           │
 * │                                                          │
 * │  溶剂体系改造:                                           │
 * │    DMSO      → 活性物预溶相 (多元醇/纳米载体)            │
 * │    PEG300    → 水相 (Water Phase)                        │
 * │    Tween 80  → 油相 (Oil Phase)                          │
 * │    ddH2O     → 乳化剂体系                                │
 * │                                                          │
 * │  新增参数:                                               │
 * │    - 产品类型: 水剂/乳液/膏霜/精华/凝胶/面膜液          │
 * │    - 乳化体系: O/W 或 W/O                                │
 * │    - HLB值自动计算                                       │
 * │    - 防腐剂协同计算                                      │
 * │    - 增稠体系触变性计算                                  │
 * │                                                          │
 * └──────────────────────────────────────────────────────────┘
 */

const COSMETIC_TEMPLATES = {
  'serum': {  // 精华液
    name: '精华液标准配方模板',
    phases: {
      'A_water': [  // A相：水相
        { name: '去离子水',       typicalPct: '70-85%', type: 'solvent' },
        { name: '甘油',           typicalPct: '3-8%',   type: 'humectant' },
        { name: '丁二醇',         typicalPct: '2-5%',   type: 'humectant' },
        { name: '黄原胶',         typicalPct: '0.1-0.3%', type: 'thickener' },
        { name: 'EDTA-2Na',       typicalPct: '0.02-0.05%', type: 'chelator' },
      ],
      'B_oil': [   // B相：油相 (精华液通常油相很少或没有)
      ],
      'C_active': [ // C相：活性物 (降温后加入)
        { name: '烟酰胺',         typicalPct: '2-5%',   type: 'active' },
        { name: '透明质酸钠',     typicalPct: '0.05-0.5%', type: 'active' },
        { name: '1,2-己二醇',     typicalPct: '0.3-1%', type: 'preservative_booster' },
      ],
      'D_preservative': [
        { name: '苯氧乙醇',       typicalPct: '0.3-0.5%', type: 'preservative' },
      ]
    },
    targetWeight: 100, // g/瓶
  },
  'cream': {  // 面霜 (O/W)
    name: 'O/W 面霜标准配方模板',
    phases: {
      'A_water': [
        { name: '去离子水',  typicalPct: '60-75%' },
        { name: '甘油',      typicalPct: '5-10%' },
        { name: '卡波姆',    typicalPct: '0.2-0.5%' },
      ],
      'B_oil': [
        { name: 'GTCC',           typicalPct: '5-10%', type: 'emollient' },
        { name: '鲸蜡硬脂醇',     typicalPct: '2-4%',  type: 'emulsifier_co' },
        { name: '乳木果脂',       typicalPct: '2-5%',  type: 'butter' },
        { name: 'Montanov 68',    typicalPct: '2-4%',  type: 'emulsifier' },
      ],
      'C_active': [
        { name: '维生素E',        typicalPct: '0.5-1%', type: 'antioxidant' },
      ],
      'D_preservative': [
        { name: '苯氧乙醇',       typicalPct: '0.5%' },
      ]
    },
    targetWeight: 50,
    emulsifierSystem: {
      type: 'O/W',
      requiredHLB: 11.5,  // O/W面霜典型值
    }
  }
};

/**
 * HLB 值计算（化妆品专用）
 * HLB (Hydrophilic-Lipophilic Balance) 亲水亲油平衡值
 */
function calculateHLB(oilPhase) {
  let totalHLB = 0;
  let totalWeight = 0;

  for (const oil of oilPhase) {
    totalHLB += oil.weight * oil.hlbRequired;
    totalWeight += oil.weight;
  }

  const requiredHLB = totalHLB / totalWeight;

  // 推荐乳化剂复配
  return {
    requiredHLB: Math.round(requiredHLB * 10) / 10,
    suggestion: getEmulsifierPair(requiredHLB)
  };
}

// 常见油相的 HLB 需求值
const OIL_HLB_VALUES = {
  '矿物油':        10.5,
  'GTCC':           5.0,
  '角鲨烷':        11.0,
  '硅油(D5)':      7.5,
  '乳木果脂':      8.0,
  '蜂蜡':          12.0,
  '荷荷巴油':       6.5,
  '甜杏仁油':       7.0,
  '橄榄油':         7.0,
  '异十六烷':       7.5,
};

// 乳化剂 HLB 值
const EMULSIFIER_HLB = {
  'Montanov 68':  8.0,
  'Montanov 202': 9.0,
  '单硬脂酸甘油酯': 3.8,
  'PEG-100 硬脂酸酯': 18.8,
  '吐温20':       16.7,
  '吐温60':       14.9,
  '吐温80':       15.0,
  '司盘60':       4.7,
  '司盘80':       4.3,
};

// 乳化剂复配计算
function getEmulsifierPair(targetHLB) {
  // 经典复配: 高HLB + 低HLB 乳化剂组合
  // 复配HLB = (HLB_A × W_A + HLB_B × W_B) / (W_A + W_B)
  // ...
}
```

---

## 7. 技术架构设计

### 7.1 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (SPA)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ 摩尔浓度  │ │ 稀释计算  │ │ 分子量    │ │ 配方配制  │  │
│  │ Calculator│ │Calculator │ │Calculator │ │Calculator │  │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘  │
│        │              │              │              │       │
│  ┌─────┴──────────────┴──────────────┴──────────────┴───┐  │
│  │              共享组件层 (Shared UI)                   │  │
│  │  UnitSelector | FormulaDisplay | StepGuide | Warning │  │
│  └─────────────────────────┬────────────────────────────┘  │
├────────────────────────────┼──────────────────────────────┤
│                     API Layer                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ /molarity│ │/dilution │ │/mw-calc  │ │ /formula  │  │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘  │
├────────┼──────────────┼──────────────┼──────────────┼─────┤
│        │         Calculation Engine                     │  │
│  ┌─────┴──────────────┴──────────────┴──────────────┴───┐  │
│  │  单位换算引擎 | 化学式解析器 | HLB计算器 | 配方引擎  │  │
│  └─────────────────────────┬────────────────────────────┘  │
├────────────────────────────┼──────────────────────────────┤
│                      Data Layer                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │元素周期表 │ │原料数据库 │ │辅料数据库 │ │法规限值库 │  │
│  │  (118)   │ │(活性物)  │ │(保健品)  │ │(IFRA/CFDA)│  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 7.2 技术选型建议

| 层面 | 技术方案 | 说明 |
|------|---------|------|
| 前端框架 | React 18 + TypeScript | 类型安全，组件复用 |
| 状态管理 | Zustand / Jotai | 轻量级原子化状态 |
| UI 组件库 | Ant Design / Shadcn UI | 丰富的表单组件 |
| 数值计算 | Web Worker | 避免主线程阻塞 |
| 可视化 | Recharts / ECharts | 连续稀释图表 |
| 后端 (可选) | Node.js + Express | API + 化学式解析 |
| 数据库 | PostgreSQL + Redis | 原料库 + 缓存 |
| 离线支持 | PWA + IndexedDB | 离线可用 |

### 7.3 核心设计模式

```
计算器使用策略模式 (Strategy Pattern):

┌──────────────────────┐
│  CalculatorContext   │    统一计算入口
│  - strategy          │
│  + calculate(params) │
└──────────┬───────────┘
           │
     ┌─────┴──────────────┐
     │                    │
┌────▼──────────┐  ┌─────▼─────────┐
│MolarityStrategy│ │DilutionStrategy│  ...
│+ calc()        │ │+ calc()        │
│+ validate()    │ │+ validate()    │
└────────────────┘ └────────────────┘
```

---

## 8. 数据库设计

### 8.1 元素周期表

```sql
CREATE TABLE elements (
  id            SERIAL PRIMARY KEY,
  atomic_number INTEGER NOT NULL UNIQUE,  -- 原子序数 1-118
  symbol        VARCHAR(3) NOT NULL UNIQUE, -- 元素符号
  name_cn       VARCHAR(20) NOT NULL,      -- 中文名
  name_en       VARCHAR(30) NOT NULL,      -- 英文名
  atomic_weight DECIMAL(12,6) NOT NULL,   -- 原子量
  category      VARCHAR(20),               -- 分类: 金属/非金属/惰性气体等
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 初始化 118 个元素
INSERT INTO elements (atomic_number, symbol, name_cn, name_en, atomic_weight) VALUES
(1,  'H',  '氢',  'Hydrogen',   1.008),
(6,  'C',  '碳',  'Carbon',    12.011),
(7,  'N',  '氮',  'Nitrogen',  14.007),
(8,  'O',  '氧',  'Oxygen',    15.999),
(11, 'Na', '钠',  'Sodium',    22.990),
(17, 'Cl', '氯',  'Chlorine',  35.450),
-- ... 等 118 个元素
;
```

### 8.2 保健品原料库

```sql
CREATE TABLE supplement_ingredients (
  id              SERIAL PRIMARY KEY,
  name_cn         VARCHAR(100) NOT NULL,     -- 中文通用名
  name_en         VARCHAR(100),              -- 英文名/INCI
  cas_number      VARCHAR(20),               -- CAS号
  molecular_formula VARCHAR(50),             -- 化学式
  molecular_weight DECIMAL(10,4),            -- 分子量
  category        VARCHAR(50),               -- 分类: 维生素/矿物质/植物提取物/氨基酸
  rdi_value       DECIMAL(10,3),             -- 推荐日摄入量 (mg)
  rdi_unit        VARCHAR(10) DEFAULT 'mg',
  max_daily       DECIMAL(10,3),             -- 每日上限 (mg)
  solubility_water VARCHAR(50),              -- 水溶性
  solubility_oil  VARCHAR(50),               -- 脂溶性
  density         DECIMAL(8,4),              -- 密度 (g/cm³)
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 示例数据
INSERT INTO supplement_ingredients (name_cn, molecular_formula, molecular_weight, category, rdi_value) VALUES
('维生素C (抗坏血酸)',     'C6H8O6',   176.12, '维生素', 100),
('维生素E (生育酚)',       'C29H50O2', 430.71, '维生素', 15),
('烟酰胺',                'C6H6N2O',  122.13, '维生素', 16),
('辅酶Q10',               'C59H90O4', 863.34, '辅酶', 30),
('左旋肉碱',              'C7H15NO3', 161.20, '氨基酸', 500);
```

### 8.3 化妆品原料库

```sql
CREATE TABLE cosmetic_ingredients (
  id              SERIAL PRIMARY KEY,
  inci_name       VARCHAR(100) NOT NULL,     -- INCI 名称
  name_cn         VARCHAR(100),              -- 中文名
  cas_number      VARCHAR(20),               -- CAS号
  function        VARCHAR(50),               -- 功能: 乳化剂/防腐剂/保湿剂等
  hlb_value       DECIMAL(5,1),              -- HLB值 (乳化剂)
  required_hlb    DECIMAL(5,1),              -- 所需HLB (油相成分)
  max_usage_pct   DECIMAL(5,2),              -- 最大使用浓度 (%)
  regulation_ref  VARCHAR(100),              -- 法规依据
  thermal_max     DECIMAL(5,1),              -- 最高耐受温度 (℃)
  ph_range        VARCHAR(20),               -- 适用pH范围
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 示例数据
INSERT INTO cosmetic_ingredients (inci_name, name_cn, function, hlb_value, max_usage_pct) VALUES
('Phenoxyethanol',       '苯氧乙醇',     '防腐剂', NULL, 1.0),
('Glycerin',             '甘油',         '保湿剂', NULL, NULL),
('Tocopherol',           '生育酚(维生素E)', '抗氧化剂', NULL, 1.0),
('Cetearyl Alcohol',     '鲸蜡硬脂醇',   '助乳化剂', NULL, 5.0),
('Glyceryl Stearate',    '单硬脂酸甘油酯', '乳化剂', 3.8, NULL),
('PEG-100 Stearate',     'PEG-100硬脂酸酯', '乳化剂', 18.8, NULL);
```

### 8.4 配方历史记录

```sql
CREATE TABLE formula_records (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER,
  formula_type    VARCHAR(20) NOT NULL,      -- 'supplement' / 'cosmetic'
  product_type    VARCHAR(50),               -- 'tablet'/'cream'/'serum' 等
  formula_name    VARCHAR(100),
  input_params    JSONB NOT NULL,            -- 完整输入参数
  output_result   JSONB NOT NULL,            -- 完整计算结果
  batch_size      DECIMAL(10,2),             -- 批次量 (g/kg)
  created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 9. API 接口设计

### 9.1 摩尔浓度计算

```
POST /api/v1/calculator/molarity

Request:
{
  "known_params": {
    "mass":    { "value": 100, "unit": "mg" },
    "conc":    { "value": null, "unit": "mM" },
    "volume":  { "value": 10,  "unit": "mL" },
    "mw":      { "value": 196.25, "unit": "g/mol" }
  },
  "target": "conc"   // 指定要求解的未知参数
}

Response:
{
  "code": 0,
  "data": {
    "result": { "value": 50.94, "unit": "mM" },
    "formula": "C = m / (V × M) = 100mg / (10mL × 196.25g/mol)",
    "unit_conversion": {
      "mass_mg": 100,
      "volume_ml": 10,
      "mw_g_per_mol": 196.25
    }
  }
}
```

### 9.2 分子量计算

```
POST /api/v1/calculator/molecular-weight

Request:
{
  "formula": "C10H16N2O2"
}

Response:
{
  "code": 0,
  "data": {
    "molecular_weight": 196.25,
    "unit": "g/mol",
    "composition": {
      "C": 10, "H": 16, "N": 2, "O": 2
    },
    "breakdown": [
      { "element": "C", "count": 10, "atomic_weight": 12.011, "subtotal": 120.11 },
      { "element": "H", "count": 16, "atomic_weight": 1.008,  "subtotal": 16.128 },
      { "element": "N", "count": 2,  "atomic_weight": 14.007, "subtotal": 28.014 },
      { "element": "O", "count": 2,  "atomic_weight": 15.999, "subtotal": 31.998 }
    ],
    "element_percentages": {
      "C": "61.21%",
      "H": "8.22%",
      "N": "14.28%",
      "O": "16.30%"
    }
  }
}
```

### 9.3 配方配制计算

```
POST /api/v1/calculator/formula

Request (化妆品精华液):
{
  "formula_type": "cosmetic",
  "product_type": "serum",
  "batch_size": { "value": 100, "unit": "g" },
  "phases": {
    "A_water": [
      { "name": "去离子水",     "percentage": 82.0 },
      { "name": "甘油",         "percentage": 5.0 },
      { "name": "丁二醇",       "percentage": 3.0 },
      { "name": "黄原胶",       "percentage": 0.15 }
    ],
    "B_active": [
      { "name": "烟酰胺",       "percentage": 5.0 },
      { "name": "透明质酸钠",   "percentage": 0.1 }
    ],
    "C_preservative": [
      { "name": "苯氧乙醇",     "percentage": 0.5 }
    ]
  }
}

Response:
{
  "code": 0,
  "data": {
    "batch_size": 100,
    "unit": "g",
    "total_percentage": 100,
    "preparation_steps": [
      {
        "phase": "A_water",
        "step": 1,
        "instruction": "将A相各成分称入主容器",
        "temperature": "室温",
        "ingredients": [
          { "name": "去离子水",   "amount": 82.0,  "unit": "g" },
          { "name": "甘油",       "amount": 5.0,   "unit": "g" },
          { "name": "丁二醇",     "amount": 3.0,   "unit": "g" },
          { "name": "黄原胶",     "amount": 0.15,  "unit": "g" }
        ]
      },
      {
        "phase": "A_water",
        "step": 2,
        "instruction": "搅拌至黄原胶完全水合，体系呈透明凝胶状",
        "temperature": "室温 - 60°C",
        "time": "15-30分钟"
      },
      {
        "phase": "B_active",
        "step": 3,
        "instruction": "降温至 ≤40°C，依次加入B相成分",
        "temperature": "≤40°C",
        "ingredients": [
          { "name": "烟酰胺",     "amount": 5.0,   "unit": "g" },
          { "name": "透明质酸钠", "amount": 0.1,   "unit": "g" }
        ]
      },
      {
        "phase": "C_preservative",
        "step": 4,
        "instruction": "加入C相防腐剂，搅拌均匀",
        "temperature": "≤40°C",
        "ingredients": [
          { "name": "苯氧乙醇",   "amount": 0.5,   "unit": "g" }
        ]
      }
    ],
    "quality_checks": [
      { "check": "pH值", "expected": "5.5-6.5" },
      { "check": "外观", "expected": "透明至半透明凝胶液" },
      { "check": "粘度", "expected": "1000-3000 cP" }
    ],
    "regulatory_check": {
      "nicotinamide_max": 5.0,
      "nicotinamide_in_formula": 5.0,
      "status": "PASS"
    }
  }
}
```

---

## 10. 前端组件设计

### 10.1 组件树

```
App
├── Layout
│   ├── Header (导航)
│   └── Sidebar (计算器选择)
├── Calculators
│   ├── MolarityCalculator
│   │   ├── InputRow (质量/浓度/体积/分子量 × 4)
│   │   │   └── UnitSelector (单位下拉框)
│   │   ├── FormulaDisplay (公式展示区)
│   │   ├── ResultPanel (结果展示)
│   │   └── ActionButtons (计算/重置)
│   │
│   ├── DilutionCalculator
│   │   ├── StandardDilution
│   │   │   ├── InputRow (C1/V1/C2/V2 × 4)
│   │   │   └── UnitSelector
│   │   └── SerialDilution
│   │       ├── InitialConcentrationInput
│   │       ├── DilutionFactorInput
│   │       ├── ResultTable (8行梯度)
│   │       └── LogChart (半对数图)
│   │
│   ├── MolecularWeightCalculator
│   │   ├── FormulaInput (化学式输入框)
│   │   ├── ElementBreakdown (元素分解表)
│   │   └── PeriodicTable (可选弹出式周期表)
│   │
│   └── FormulaCalculator
│       ├── ProductTypeSelector (产品类型选择)
│       ├── PhaseEditor (各相成分编辑器)
│       │   ├── IngredientRow (可增删的成分行)
│       │   └── PercentageValidator (百分比校验)
│       ├── StepGuide (分步骤指引)
│       └── RegulatoryCheck (法规合规检查)
│
└── Shared
    ├── UnitSelector
    ├── NumericInput
    ├── FormulaDisplay
    ├── WarningAlert
    └── ExportButton
```

### 10.2 关键组件示例

```tsx
// UnitSelector.tsx - 可复用单位选择器
interface UnitSelectorProps {
  value: string;
  options: { label: string; value: string; factor: number }[];
  onChange: (unit: string) => void;
}

// FormulaDisplay.tsx - 公式动态展示
interface FormulaDisplayProps {
  formula: string;         // "C₁ × V₁ = C₂ × V₂"
  values?: Record<string, number>;
  highlighted?: string;    // 高亮正在计算的变量
}

// StepGuide.tsx - 分步操作指引 (配方计算器核心组件)
interface StepGuideProps {
  steps: {
    order: number;
    phase: string;         // A_water / B_oil / C_active 等
    instruction: string;
    temperature: string;
    ingredients: { name: string; amount: number; unit: string }[];
    note?: string;
  }[];
  currentStep?: number;    // 当前查看的步骤
}
```

### 10.3 状态管理设计

```typescript
// store/calculatorStore.ts (Zustand)
interface CalculatorStore {
  // 摩尔浓度计算器
  molarity: {
    mass:   { value: number | null; unit: string };
    conc:   { value: number | null; unit: string };
    volume: { value: number | null; unit: string };
    mw:     { value: number | null };
    target: 'mass' | 'conc' | 'volume' | 'mw' | null;
    result: { value: number; unit: string } | null;
  };

  // 配方计算器
  formula: {
    type: 'supplement' | 'cosmetic';
    productType: string;          // 'tablet' | 'cream' | 'serum'...
    batchSize: { value: number; unit: string };
    phases: Record<string, Array<{
      name: string;
      percentage: number;
      type?: string;              // 'active' | 'excipient' | 'preservative'
    }>>;
    result: FormulaResult | null;
  };

  // actions
  calculateMolarity: () => void;
  calculateDilution: () => void;
  calculateMW: (formula: string) => void;
  calculateFormula: () => void;
  resetAll: () => void;
}
```

---

## 11. 保健品/化妆品专属增强功能

### 11.1 保健品专用功能

| 功能 | 说明 | 算法 |
|------|------|------|
| 日摄入量计算器 | 根据单片含量 × 每日片数 → 日均摄入量 → 与RDI对比 | `daily = content_per_tablet × tablets_per_day` |
| 投料量计算器 | 考虑生产损耗，标识含量 → 实际投料量 | `actual = label_content × (1 + overage_rate)` |
| 崩解时限预估 | 根据崩解剂比例和片剂硬度估算崩解时间 | 经验公式 |
| 辅料相容性检查 | 根据活性物化学性质推荐相容辅料 | 规则引擎 |
| 片重/胶囊壳选择 | 根据填充量推荐胶囊型号 (#00-#4) | `shell_volume ≥ fill_weight / density` |

### 11.2 化妆品专用功能

| 功能 | 说明 | 算法 |
|------|------|------|
| HLB值自动计算 | 输入油相成分 → 计算所需HLB → 推荐乳化剂 | `HLB_req = Σ(Wi × HLBi) / ΣWi` |
| 防晒剂复配 | 多防晒剂组合 → SPF/PA 估算 | 基于临界波长和吸光度 |
| 防腐挑战计算 | 多防腐剂协同 → 等效防腐指数 | `PCI = Σ(Ci / MICi)` |
| 增稠体系 | 卡波姆 + 中和剂 → 预估粘度 | 浓度-粘度曲线 |
| IFRA合规检查 | 香精香料含量 vs IFRA 49类上限 | 规则匹配 |
| 稳定性预测 | pH/温度/光照 vs 活性物降解率 | Arrhenius 方程 |

### 11.3 多语言支持

```
单位系统切换:
  - 国际: mg, g, kg, L, mL, %(w/w), %(w/v)
  - 中国: 毫克, 克, 千克, 升, 毫升, 百分比
  - 美国: oz, lb, gal, fl.oz, %w/w

区域法规集成:
  - 中国: GB 16740 (保健食品), 《化妆品安全技术规范》(2015)
  - 欧盟: EC 1223/2009 (化妆品法规), Annex II-VI
  - 美国: FDA 21 CFR, MoCRA 2022
```

### 11.4 导出功能

```
配方导出格式:
  - PDF: 含公司抬头、配方表、工艺流程图、质检标准
  - Excel: 原料清单 + 用量 + 单价 + 成本核算
  - JSON: API 对接 MES/ERP 系统
  - INCI 标签: 按含量降序排列的成分标签
```

---

## 附录 A：单位换算速查表

```
质量换算:
  1 kg = 1000 g
  1 g  = 1000 mg
  1 mg = 1000 μg
  1 μg = 1000 ng
  1 ng = 1000 pg

浓度换算:
  1 M  = 1000 mM
  1 mM = 1000 μM
  1 μM = 1000 nM
  1 nM = 1000 pM
  1 pM = 1000 fM

体积换算:
  1 L   = 1000 mL
  1 mL  = 1000 μL
  1 μL  = 1000 nL

化妆品常用:
  1 kg 批次: 所有百分比 = 克(g)
  100g 批次: 百分比 = 克(g), 0.1% = 0.1g
  实验室小样: 1% = 0.5g (50g批次)
```

## 附录 B：关键化学数据

```
常用原子量 (精确到 3 位小数):
  H=1.008, C=12.011, N=14.007, O=15.999
  Na=22.990, Mg=24.305, P=30.974, S=32.06
  Cl=35.45,  K=39.098,  Ca=40.078, Fe=55.845
  Cu=63.546, Zn=65.38,  Se=78.971, I=126.90

常用保健品分子量:
  维生素C (C6H8O6)          = 176.12
  维生素E (C29H50O2)        = 430.71
  维生素A (C20H30O)         = 286.45
  维生素D3 (C27H44O)        = 384.64
  辅酶Q10 (C59H90O4)        = 863.34
  白藜芦醇 (C14H12O3)       = 228.24
  叶黄素 (C40H56O2)         = 568.87

常用化妆品分子量:
  烟酰胺 (C6H6N2O)          = 122.13
  透明质酸 (C14H21NO11)n    = ~403.31/单元
  水杨酸 (C7H6O3)           = 138.12
  苯氧乙醇 (C8H10O2)        = 138.16
  视黄醇 (C20H30O)          = 286.45
  抗坏血酸 (C6H8O6)         = 176.12
  甘草酸二钾 (C42H60K2O16)  = 899.13
```

---

> **文档版本**: v1.0  
> **创建日期**: 2026-05-22  
> **适用范围**: 保健品配方开发 / 化妆品配方开发计算系统  
> **参考来源**: selleck.cn 计算器工具分析
