# 意数系统 (Yishu System)

> **基于 AI 驱动的现代化术数推演与决策辅助系统**

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

## ✨ 核心特性

- **专家团会诊模式**: 模拟多位术数专家（如“奇门推演官”、“六爻详考员”）协同分析，输出结构化报告。
- **双模推演引擎**:
  - **奇门遁甲 (Qi Men)**: 自动化起局逻辑，支持值符、值使及三奇六仪的动态推算。
  - **六爻纳甲 (Liu Yao)**: 严谨的纳甲排盘与五行生克实证。
- **五行精选取名**: 结合生辰八字与五行补益的高级取名建议模块。
- **现代化 UI/UX**: 采用暗色调、玻璃拟态设计，提供极具专业感和神秘感的交互体验。
- **生产级架构**: 基于 Next.js 15+、Prisma 和 Docker 容器化方案，具备部署透明性。

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
