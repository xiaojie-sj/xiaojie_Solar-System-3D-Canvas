import { PlanetConfig } from '../types';

export const SUN_CONFIG: PlanetConfig = {
  id: 'sun',
  name: '太阳',
  nameEn: 'Sun',
  color: '#ffaa00',
  radius: 12.0,
  realRadiusKm: 696340,
  distance: 0,
  realDistanceAU: 0,
  orbitPeriodDays: 0,
  rotationPeriodHours: 600, // ~25-35 days
  axialTiltDeg: 7.25,
  textureType: 'sun',
  hasAtmosphere: true,
  atmosphereColor: '#ff8800',
  description: '太阳系的中心天体，一颗黄矮星（G2V型），占太阳系总质量的99.86%。其核心每秒将6亿吨氢聚变为氦，为整个星系提供光与热。',
  type: '恒星',
  temperature: '表面 ~5,500°C / 核心 ~15,000,000°C',
  moonsCount: 8, // 8 planets
  gravity: '274.0 m/s²',
  facts: [
    '太阳的体积大约是地球的130万倍。',
    '光线从太阳表面到达地球需要大约8分20秒。',
    '太阳处于主序星阶段，预计还能持续稳定发光约50亿年。'
  ]
};

export const PLANETS_CONFIG: PlanetConfig[] = [
  {
    id: 'mercury',
    name: '水星',
    nameEn: 'Mercury',
    color: '#a59b8f',
    radius: 1.6,
    realRadiusKm: 2439.7,
    distance: 22,
    realDistanceAU: 0.387,
    orbitPeriodDays: 87.97,
    rotationPeriodHours: 1407.6, // 58.6 days
    axialTiltDeg: 0.034,
    textureType: 'mercury',
    hasAtmosphere: false,
    description: '太阳系最内侧且最小的行星，表面布满密密麻麻的撞击坑，昼夜温差极大，且没有实质性的大气层来保持温度。',
    type: '类地行星',
    temperature: '-180°C 至 430°C',
    moonsCount: 0,
    gravity: '3.7 m/s²',
    facts: [
      '水星的一年只有88天，但在水星上经历一次日出到下一次日出需176地球日。',
      '水星拥有巨大的铁核，占其体积的约42%。',
      '卡洛里斯盆地（Caloris Basin）是水星上最大的撞击盆地，直径达1550公里。'
    ]
  },
  {
    id: 'venus',
    name: '金星',
    nameEn: 'Venus',
    color: '#e3bb76',
    radius: 2.8,
    realRadiusKm: 6051.8,
    distance: 34,
    realDistanceAU: 0.723,
    orbitPeriodDays: 224.7,
    rotationPeriodHours: -5832.5, // retrograde rotation (-243 days)
    axialTiltDeg: 177.3,
    textureType: 'venus',
    hasAtmosphere: true,
    atmosphereColor: '#ffc870',
    description: '全天最明亮的行星，常被称为地球的“姊妹星”。其浓厚的大气层由二氧化碳和浓硫酸云层构成，引发失控的温室效应，成为太阳系表面最炽热的行星。',
    type: '类地行星',
    temperature: '平均 ~465°C（恒定高温）',
    moonsCount: 0,
    gravity: '8.87 m/s²',
    facts: [
      '金星自西向东逆向自转，在金星上太阳从西边升起、东边落下。',
      '金星表面气压是地球的92倍，相当于地球海洋深处900米的压强。',
      '金星自转一天（243天）比它公转一年（225天）还要长。'
    ]
  },
  {
    id: 'earth',
    name: '地球',
    nameEn: 'Earth',
    color: '#2b82c9',
    radius: 3.0,
    realRadiusKm: 6371.0,
    distance: 48,
    realDistanceAU: 1.0,
    orbitPeriodDays: 365.25,
    rotationPeriodHours: 23.93,
    axialTiltDeg: 23.44,
    textureType: 'earth',
    hasAtmosphere: true,
    atmosphereColor: '#00a6ff',
    hasClouds: true,
    description: '人类赖以生存的摇篮，已知宇宙中唯一孕育生命的天体。拥有辽阔的液态水海洋、富氧大气层和活跃的地质构造。',
    type: '类地行星',
    temperature: '-88°C 至 58°C（平均 15°C）',
    moonsCount: 1, // Luna
    gravity: '9.807 m/s²',
    facts: [
      '地球表面约71%被海洋覆盖，被称为“蓝色弹珠”。',
      '地球磁场保护地球免受太阳风高能带电粒子的轰击。',
      '地球伴有一颗相对巨大的天然卫星——月球，维持了地球自转轴倾角的长期稳定。'
    ]
  },
  {
    id: 'mars',
    name: '火星',
    nameEn: 'Mars',
    color: '#cc5533',
    radius: 2.1,
    realRadiusKm: 3389.5,
    distance: 62,
    realDistanceAU: 1.524,
    orbitPeriodDays: 686.98,
    rotationPeriodHours: 24.62,
    axialTiltDeg: 25.19,
    textureType: 'mars',
    hasAtmosphere: true,
    atmosphereColor: '#ffaa88',
    description: '被称为“红色星球”，表面富含氧化铁（铁锈），拥有太阳系最高火山奥林匹斯山以及最深巨大的水手峡谷，是未来深空探测与移民的热门天体。',
    type: '类地行星',
    temperature: '-140°C 至 20°C（平均 -63°C）',
    moonsCount: 2, // Phobos, Deimos
    gravity: '3.721 m/s²',
    facts: [
      '奥林匹斯山高约21.9公里，几乎是珠穆朗玛峰高度的2.5倍。',
      '火星的自转周期（火星日）为24小时37分，与地球极为相近。',
      '火星南北两极拥有由水冰和干冰构成的明显白色极冠。'
    ]
  },
  {
    id: 'jupiter',
    name: '木星',
    nameEn: 'Jupiter',
    color: '#d4a373',
    radius: 6.8,
    realRadiusKm: 69911,
    distance: 82,
    realDistanceAU: 5.204,
    orbitPeriodDays: 4332.59, // 11.86 years
    rotationPeriodHours: 9.93,
    axialTiltDeg: 3.13,
    textureType: 'jupiter',
    hasAtmosphere: true,
    atmosphereColor: '#f4c390',
    description: '太阳系八大行星中体积与质量最大的行星，其质量是其余所有行星总和的2.5倍。拥有壮丽的气体条纹云带和持续数百年之久的巨型反气旋风暴“大红斑”。',
    type: '气态巨行星',
    temperature: '云顶 ~ -110°C',
    moonsCount: 95,
    gravity: '24.79 m/s²',
    facts: [
      '木星自转速度极快，不到10小时自转一周，使其赤道部分明显隆起。',
      '木星的大红斑风暴已经刮了至少350年，足以装下整个地球。',
      '木星拥有庞大的卫星系统，包括四颗伽利略卫星（木卫一、二、三、四）。'
    ]
  },
  {
    id: 'saturn',
    name: '土星',
    nameEn: 'Saturn',
    color: '#e0c896',
    radius: 5.8,
    realRadiusKm: 58232,
    distance: 106,
    realDistanceAU: 9.582,
    orbitPeriodDays: 10759.22, // 29.45 years
    rotationPeriodHours: 10.7,
    axialTiltDeg: 26.73,
    textureType: 'saturn',
    hasAtmosphere: true,
    atmosphereColor: '#edd8aa',
    hasRings: true,
    ringsInnerRadius: 7.2,
    ringsOuterRadius: 13.5,
    description: '以其无比璀璨宽广的光环系统闻名于世，主要由数以百亿计的水冰颗粒、微尘和岩石碎片构成，平均密度甚至小于液态水。',
    type: '气态巨行星',
    temperature: '云顶 ~ -140°C',
    moonsCount: 146,
    gravity: '10.44 m/s²',
    facts: [
      '土星是太阳系中密度最小的行星（0.687 g/cm³），如果有一汪足够大的水，土星能浮在水面上。',
      '土星环横跨数十万公里，但厚度平均仅有十几米到数十米。',
      '土卫六（泰坦）是太阳系中唯一拥有浓密大气层的卫星。'
    ]
  },
  {
    id: 'uranus',
    name: '天王星',
    nameEn: 'Uranus',
    color: '#7de2d1',
    radius: 4.0,
    realRadiusKm: 25362,
    distance: 128,
    realDistanceAU: 19.2,
    orbitPeriodDays: 30685.4, // 84 years
    rotationPeriodHours: -17.24, // retrograde
    axialTiltDeg: 97.77,
    textureType: 'uranus',
    hasAtmosphere: true,
    atmosphereColor: '#80e8df',
    hasRings: true,
    ringsInnerRadius: 4.8,
    ringsOuterRadius: 6.5,
    description: '一颗冰巨星，大气层中含有甲烷气体使其呈现优雅的青色，其最独特的特征是极端的“躺平”自转姿态，自转轴几乎平行于黄道面。',
    type: '冰巨星',
    temperature: '云顶 ~ -195°C',
    moonsCount: 28,
    gravity: '8.69 m/s²',
    facts: [
      '天王星自转轴倾角高达97.8度，被称为在公转轨道上“滚着走”的行星。',
      '天王星是现代人借助望远镜发现的第一颗行星（威廉·赫歇尔于1781年发现）。',
      '天王星的极地地区在42年间持续朝向太阳，随后陷入长达42年的极夜。'
    ]
  },
  {
    id: 'neptune',
    name: '海王星',
    nameEn: 'Neptune',
    color: '#3f72af',
    radius: 3.8,
    realRadiusKm: 24622,
    distance: 148,
    realDistanceAU: 30.05,
    orbitPeriodDays: 60189.0, // 164.8 years
    rotationPeriodHours: 16.11,
    axialTiltDeg: 28.32,
    textureType: 'neptune',
    hasAtmosphere: true,
    atmosphereColor: '#5383d3',
    description: '太阳系已知最遥远的行星，呈现深邃的蔚蓝色，大气活动极度剧烈，拥有太阳系已知速度最快的超音速狂风（时速可达2100公里）。',
    type: '冰巨星',
    temperature: '云顶 ~ -200°C',
    moonsCount: 16,
    gravity: '11.15 m/s²',
    facts: [
      '海王星是通过纯数学计算预测位置，随后用望远镜观测证实的行星，被称为“笔尖上发现的行星”。',
      '海王星的大气风速高达每小时2100公里以上，超过两倍音速。',
      '海王星最大的卫星“海卫一”（Triton）拥有逆行轨道，并存在活跃的氮气冰火山。'
    ]
  }
];

export const ALL_CELESTIAL_BODIES = [SUN_CONFIG, ...PLANETS_CONFIG];
