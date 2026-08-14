# img2threejs Hero Props — 参考图规格

目标：用 img2threejs **Procedural** 模式替换 3 个 silhouette 关键道具，输出可进仓库的 TypeScript factory，再 remap 到本项目 `PALETTE`。

## 优先级

| # | Prop | 替换目标 | 参考图文件（建议） |
|---|------|----------|-------------------|
| 1 | CRT Monitor | `addCrtMonitor` / 工位显示器 | `docs/refs/crt_monitor.png` |
| 2 | Office Printer | `createPrinter` | `docs/refs/printer.png` |
| 3 | Refresh Vending | `createVendingMachine` | `docs/refs/vending_refresh.png` |

## 参考图要求

- **单物、干净背景**（白/浅灰），避免场景透视干扰
- 优先 **三视图拼板**（正 / 侧 / 顶）；没有则用清晰 3/4 角一张
- 风格对齐 `docs/style.png`：米色塑料 CRT、复古落地复印机/打印机、金属框贩卖机
- 分辨率 ≥ 1024；硬边清晰；不要卡通线稿
- Quiet Dread：低饱和、略旧、不要赛博霓虹

## 输出接入约定

每个 prop 生成后应提供：

```ts
// src/world/generated/createCrtMonitorModel.ts
export function createCrtMonitorModel(options?: {...}): THREE.Group
```

接入时：

1. 保持 **floor-contact center** pivot（与现有家具一致）
2. **碰撞仍用** `colliders.addAabb(...)`，不要直接用生成 mesh collider
3. CRT 屏幕 mesh 设 `userData.isCrt = true` 以接入 `CrtFlicker`
4. 材质色尽量改引用 `getMaterial` / `plasticMaterial` / `metalMaterial`，避免另起一套色

## 调用示例（Claude Code / Codex）

```
/img2threejs Rebuild this object as a Three.js model.
Quiet Dread corporate office prop. Hard-surface, beige plastic / steel.
Keep proportions. Export TypeScript factory + ObjectSculptSpec.
Pivot at floor-contact center. Include sockets for screen / tray if relevant.
```

## 验收

- 5–8m 外能立刻认出 Printer / CRT / Vending
- 近看有面板缝、通风口、托盘等零件，而不是单盒
- 与地毯 / 荧光灯 / 后处理同屏不「玩具感」
