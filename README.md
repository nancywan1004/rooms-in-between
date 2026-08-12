# Rooms Between — Office MVP

第一人称 stylized 办公室场景（Pass 1–3）：可行走、可追逐绕行、模块化房间、统一 pastel palette。

## 运行

```bash
npm install
npm run dev
```

浏览器打开后点击画面锁定鼠标。

## 操作

| 按键 | 作用 |
|------|------|
| WASD | 移动 |
| 鼠标 | 环视 |
| Shift | 奔跑 |
| E | 开关附近的门 |
| Esc | 释放鼠标 |

电梯门保持锁定（`ACCESS DENIED`）。其余门本阶段可开关，方便走遍全图。

开发快捷键：`8` / `9` / `0` 切换 `PRESSURE` / `STRANGE` / `ORDER` 状态骨架。

## 场景结构

- **Open Office** `(0,0,0)` — Hub，工位岛 + 四向通道
- **Printer Room** 西侧 — Rule #1
- **Break Room** 东侧 — Rule #2
- **Manager Office** 北侧 — Rule #3
- **Meeting Room** 南侧 — Final Boss

出生点：电梯前 `(-3.5, 0, 5)`。

控制台可用 `setOfficeState('ORDER' | 'STRANGE' | 'PRESSURE' | 'BOSS' | 'FREEDOM')`。

## 技术

Vite + Three.js + TypeScript。碰撞为自研 AABB；材质统一走 `src/theme/palette.ts`。
