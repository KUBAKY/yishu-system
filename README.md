# 意数系统 (Yishu System)

> **基于 AI 大模型驱动的现代化术数推演与决策辅助系统 | A Modern AI-Powered Metaphysics Inference & Decision Support Platform**

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black)](https://nextjs.org/)
[![Status](https://img.shields.io/badge/Status-Open--Source-green)](#)

意数系统是一个融合了传统术数逻辑（奇门遁甲、六爻纳甲）与现代 AI 大模型技术的推演平台。它通过“专家团 (Expert Team)”会诊模式，为用户提供多维度的决策辅助与实证分析。

---

## ⚠️ 重要声明：非商业使用限制

**本项目采用 [CC BY-NC-SA 4.0 (署名-非商业性使用-相同方式共享 4.0 国际)](LICENSE) 协议。**

在使用本项目代码前，请务必阅读以下提醒：
1. **禁止商用**: 您不得将本项目或其任何部分的源代码、算法、UI 设计用于任何形式的商业盈利活动。
2. **署名要求**: 如果您在研究或非商业项目中引用了本项目，必须保留原作者署名。
3. **相同方式共享**: 若您基于本项目进行二次开发，您的作品也必须以相同的非商业许可协议发布。

---

## ✨ 核心特性 (Core Paradigms)

本项目深度集成了十项专业的术数推演与量化分析模块：

- **八字命理 (Bazi)**: 子平真诠，洞察先天格局与岁运起伏。
- **六爻纳甲 (Liu Yao)**: 卜问人事忧疑与吉凶应期。
- **梅花易数 (Meihua)**: 观物起卦，捕捉天地外应。
- **奇门遁甲 (Qi Men)**: 时空博弈下的决胜运筹。
- **堪舆风水 (Feng Shui)**: 调和场域与生命的能量契合。
- **星占塔罗 (Zodiac & Tarot)**: 群星轨迹与牌阵映心，揭示成长路径。
- **手相面相 (Palmistry & Physio)**: 识别行为节律与阶段风险信号。
- **五行取名 (Naming)**: 结合本命八字与数理逻辑的补益建议。
- **专家团会诊模式**: 模拟多领域专家协同输出高可用的决策报告。

---

## 🚀 快速开始

### 1. 环境准备
确保您的开发环境已安装 `Node.js 20+`。

### 2. 克隆项目
```bash
git clone https://github.com/KUBAKY/yishu-system.git
cd yishu-system
```

### 3. 配置环境变量
参考项目根目录下的 `.env.example` 文件，创建您的 `.env.local`：
```bash
cp .env.example .env.local
# 填入您的 OPENROUTER_API_KEY
```

### 4. 安装依赖并启动
```bash
npm install
npx prisma generate
npm run dev
```

---

## 📦 部署指南

本项目支持多种部署方式：
- **Vercel**: 推荐用于前端预览。
- **Docker**: 推荐用于云端服务器部署。详见 [Docker 部署指南](DOCKER_DEPLOY_GUIDE.md)。

---

## 📜 免责声明

1. 本项目推演结果仅供**学术研究与娱乐参考**。
2. 作者不对用户基于本系统做出的任何金融、投资、健康或生活决策承担任何法律责任。
3. 术数推演属于概率与逻辑模型，不代表必然之事实。

---

## 🤝 贡献与反馈

欢迎提交 Issue 或 Pull Request。在提交前，请确保您的改动符合本项目的非商业协议要求。

---
*由 [KUBAKY](https://github.com/KUBAKY) 开发与维护*
