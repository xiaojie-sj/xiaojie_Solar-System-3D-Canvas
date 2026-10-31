# 🪐 Solaris 3D — 太阳系极度仿真漫游与全息手势交互系统

<div align="center">

![Solaris 3D 太阳系漫游系统](/screenshots/solaris_hero_banner.jpg)

**基于 Three.js PBR 物理渲染与 Google MediaPipe 21 点手部关键点检测的下一代空间探索体验**

[![Three.js](https://img.shields.io/badge/Three.js-r187-black?style=flat&logo=three.js)](https://threejs.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?style=flat&logo=react)](https://react.dev/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Vision_Tasks-00f3ff?style=flat&logo=google)](https://developers.google.com/mediapipe)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff?style=flat&logo=vite)](https://vitejs.dev/)
[![NASA Assets](https://img.shields.io/badge/Data-NASA_%26_ESA_Official-0b3d91?style=flat&logo=nasa)](https://nasa.gov/)

</div>

---

## 📖 项目简介

**Solaris 3D** 是一款集成了**电影级天体物理仿真**与**隔空手势体感交互**的 Web 3D 太阳系科普漫游系统。项目搭载了 NASA（美国宇航局）与 ESA（欧洲航天局）官方探测器发布的实测地貌遥感数据，运用自定义 GLSL 物理着色器还原了真实的太阳光球活动、地球昼夜分界线、城市夜光点阵、海洋日光镜面反光及土星光环本影投射。

此外，系统突破性地引入了 **Google MediaPipe Vision Tasks** 深度学习骨架检测引擎，用户无需额外佩戴任何传感器硬件，只需开启普通电脑摄像头，即可使用科幻感十足的**隔空五大手势**对全星系进行全息旋转、微距缩放、时间冻结与激光瞄准锁定。

---

## 🌟 核心效果与技能特性

### 1. 🔭 NASA / ESA 官方实测模型与极度仿真材质
- **地球（Blue Marble & Black Marble）**：向阳面搭载 NASA 2048px 高清地貌与大陆架，海洋基于视线与日光夹角计算 Blinn-Phong 镜面高光；背阳面自动点亮欧洲、东亚、北美等全球城市夜光群；外层搭载独立物理自转气旋云层与蓝青色瑞利散射辉光。
- **太阳（SDO 太阳动力学天文台实测表面）**：采用官方高分辨率实测光球层贴图，去除了人工生硬外框，采用物理柔和高斯日冕辉光自然散逸至外层深空。
- **水星（MESSENGER 信使号）**：信使号拍摄全貌与高程置换凹凸图（Bump Map），还原真实且高反差的陨石撞击坑射线与极度严酷的晨昏明暗线。
- **金星（Magellan 麦哲伦号）**：厚重浓硫酸云层与穿透雷达地形数据，带有强烈的金黄色温室大气菲涅尔散射。
- **火星（Viking / MGS 勘测者）**：逼真呈现奥林匹斯山（太阳系最高火山）、水手号大峡谷裂谷以及极冠干冰冰霜。
- **木星（Cassini / Juno 朱诺号）**：还原 16 条不同纬度相反风向对流云带、赤道羽状湍流以及带有内部逆时针旋涡的大红斑。
- **土星（Cassini 真实光环本影遮挡算法）**：自定义 GLSL 着色器实时计算土星球体在光环上的**真实几何本影遮挡（Planet-to-Ring Shadow）**，精准再现卡西尼缝、恩克缝以及背光处的黑色椭圆阴影。
- **天王星与海王星（Voyager 2 旅行者二号）**：真实再现天王星 97.8° 侧卧公转轴倾角，以及海王星深邃的钴蓝甲烷大气与大黑斑。

---

### 2. 🖐️ 创新手势交互：Google MediaPipe 全息体感控制

<div align="center">

![MediaPipe 手势控制图解](/screenshots/mediapipe_gesture_guide.jpg)

</div>

系统内置 Google MediaPipe 深度学习模型，以 60 FPS 实时追踪单手 **21 个三维关节坐标**，构建了五种自然手势映射：

| 手势图标 | 手势名称 | 动作要领 | 触发的三维宇宙效果 |
| :---: | :---: | :--- | :--- |
| 🖐️ | **掌心漫游** | 五指自然张开，掌心在空中平移 | **3D 视角自由旋转**：随手部移动平滑绕转星系，自由变换仰俯角与方位角 |
| 👌 | **微距缩放** | 拇指与食指捏合 / 展开 | **焦距深度拉伸**：两指闭合向内推拉镜头，贴近行星表面；两指展开推远视角 |
| ✊ | **时间冻结** | 五指聚拢快速握拳 | **时空静止（Time Stasis）**：瞬间冻结全星系行星公转与自转，手掌重新张开即可自然恢复 |
| ✌️ | **天体跃迁** | 竖起食指与中指（胜利手势） | **航向跃迁（Quantum Jump）**：摄像机平滑加速滑翔至轨道序列中的下一个天体 |
| ☝️ | **激光锁定** | 单独伸出食指指向前方 | **全息瞄准锁星**：屏幕浮现赛博雷达准星跟随指尖，对准行星悬停 0.5s 即刻完成自动聚焦与科普面板展开 |

> 🔒 **隐私说明**：MediaPipe 推理完全在浏览器本地 WebAssembly / WebGL GPU 上执行，视频流仅在客户端内存解析，绝不上载任何云端服务器。

---

### 3. 🛸 宇宙深空与物理动力学系统
- **物理自转与公转动力学**：各天体按照真实开普勒周期比例运转，并严格赋予精确的自转轴倾角（地月系统独立同步运转）。
- **火木小行星带（Asteroid Belt）**：在火星与木星之间利用 `THREE.InstancedMesh` 高性能实例渲染了 1,400 颗各向旋转的小行星多面体，赋予宏伟空间景深。
- **深空全天银河天球**：采用 NASA/ESA 官方银河全景星图天球，外加 3,500 颗按照真实恒星光谱色彩（O/B/A/G/M 型）分布的发光星点。

---

### 4. 🎛️ 人体工程学 HUD 与多视角预设
- **多视角一键切换**：全景仰视 (45°)、黄道顶视 (90°)、黄道边缘平视 (0°)、内太阳系聚焦、外行星宏观视角。
- **比例模式切换**：
  - **观赏优化比例**：天体大小与间距经过视觉黄金分割调校，细节最丰富、观赏性最高；
  - **真实天文比例**：严格基于 AU（天文单位）间距呈现天体间的空旷浩瀚。
- **折叠式底部控制坞（Bottom Dock）**：占视口面积低于 15%，拒绝模糊遮罩掉帧，支持自由折叠与快捷键唤起。
- **天体百科卡片**：即时调阅当前天体的赤道半径、公转周期、自转倾角、表面环境温度、重力加速度、卫星数量及重大天文科学发现。

---

## ⌨️ 快捷键指南

| 按键 | 功能说明 |
| :---: | :--- |
| `Space` | 暂停 / 恢复太阳系公转与自转运转 |
| `Esc` | 重置全景视角，关闭当前选中天体信息卡片 |
| `0` | 镜头立即锁定中央太阳 |
| `1` ~ `8` | 依次快速跃迁至水星、金星、地球、火星、木星、土星、天王星、海王星 |
| `H` | 快速展开 / 折叠底部控制坞 |

---

## 🛠️ 技术架构

- **核心渲染引擎**：[Three.js r187](https://github.com/mrdoob/three.js) (WebGL2, ACESFilmicToneMapping, PCFSoftShadowMap)
- **视觉计算框架**：[@mediapipe/tasks-vision](https://www.npmjs.com/package/@mediapipe/tasks-vision) (Local WASM + GPU Delegate)
- **前端视图组件**：React 19, TypeScript 7
- **工程化构建工具**：Vite 8, Tailwind CSS v4
- **图标与动效**：Lucide React, Motion

---

## 🚀 本地运行指南

1. **克隆项目并安装依赖**：
   ```bash
   git clone <repo-url>
   cd applet
   npm install
   ```

2. **启动本地开发服务器**：
   ```bash
   npm run dev
   ```

3. **浏览器体验**：
   - 打开浏览器访问 `http://localhost:3000`；
   - 首次进入时，页面中央会弹出**开启全息手势交互**提示框，点击【弹出开启摄像头提示】并在浏览器原生授权窗中点击**允许**，即可进入隔空手势操控体验。

---

<div align="center">
  <sub>Built with Google AI Studio & Three.js · Solaris 3D Simulation System</sub>
</div>
