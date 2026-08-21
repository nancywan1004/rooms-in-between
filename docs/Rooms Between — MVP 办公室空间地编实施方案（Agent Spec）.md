# Rooms Between — MVP 办公室空间地编实施方案

## 1. 目标

为 Hackathon MVP 搭建一个可玩的第一人称 3D 办公室场景。

核心目标不是做最终美术，而是尽快完成一版：

- 可完整行走
- 可理解空间结构
- 可承载 Rule #1 / Rule #2 / Rule #3
- 可支持 Manager 巡逻与追逐
- 可支持会议室 Final Boss
- 可在运行时改变部分空间
- 后续容易替换为 stylized 美术资产

当前阶段优先：

> **Gameplay readability > Visual fidelity**

但整体视觉语言需从一开始遵循：

> Pastel Stylized Corporate Liminalism

参考气质：

- Monument Valley 式简洁几何
- 柔和低饱和色块
- 企业办公室空间
- 微妙的超现实比例
- 少纹理、强结构、强灯光
- Cute → Strange → Oppressive

---

# 2. 技术假设

默认使用：

- Three.js
- TypeScript
- GLB / procedural primitives 混合
- img2threejs 用于部分 props
- Blender 仅用于后续特殊资产

初版场景尽量采用：

- `BoxGeometry`
- `PlaneGeometry`
- `RoundedBoxGeometry`
- `CapsuleGeometry`
- 简单 GLB props

不要把整张地图合成一个 mesh。

所有房间、墙体、家具、门、灯、触发器必须保持模块化。

---



# 3. 世界尺寸规范

统一使用：

> **1 Three.js unit = 1 meter**

推荐尺寸：

- 玩家高度：1.65–1.7m
- 门高：2.2m
- 门宽：1.0–1.2m
- 普通办公室层高：3.0m
- 开放办公区层高：3.4m
- Boss Meeting Room：4.5–5m
- 标准墙厚：0.15–0.2m
- 走廊最窄宽度：1.8m
- 主通道宽度：2.4–3.0m
- Desk：1.4 × 0.7m
- Desk cluster 间净距：1.3m 以上

所有资产 pivot 尽量统一放在：

> floor-contact center

方便运行时移动和生成。

---



# 4. 整体地图结构

场景只做一个办公室楼层。

建议初版整体 footprint：

> 约 28m × 22m

基本结构：

```text
                           NORTH

                  ┌───────────────────┐
                  │   MANAGER OFFICE  │
                  │                   │
                  │   Rule #3 Area    │
                  └─────────┬─────────┘
                            │
                            │
┌───────────────┐   ┌───────┴─────────┐   ┌───────────────┐
│               │   │                 │   │               │
│ PRINTER ROOM  ├───┤   OPEN OFFICE   ├───┤  BREAK ROOM   │
│               │   │                 │   │               │
│ Rule #1       │   │   Central Hub   │   │ Rule #2       │
│               │   │                 │   │               │
└───────────────┘   └───────┬─────────┘   └───────────────┘
                            │
                            │
                  ┌─────────┴─────────┐
                  │                   │
                  │   MEETING ROOM    │
                  │                   │
                  │    FINAL BOSS     │
                  │                   │
                  └───────────────────┘

                           SOUTH
```

玩家从 Open Office 南侧偏西的电梯区出生。

所有主要区域都应该能从 Open Office 看到部分入口。

玩家必须尽快形成心智地图。

---



# 5. 推荐坐标布局

以 Open Office 中心为：

> `(0, 0, 0)`

Y 为垂直方向。

## Open Office

范围：

- X: -7 → 7
- Z: -6 → 6

尺寸：

> 14m × 12m

这是整个场景核心 Hub。

放置：

- 12–16 个工位
- 中央主通道
- 2 个植物
- 1 个文件柜区
- 玻璃隔断
- 电梯入口
- 一块 Rule / Compliance Notice 展示区

不要填满。

初版要保留约 35–40% 空地。

---



## Printer Room

中心：

> `(-10.5, 0, 0)`

尺寸：

> 6m × 7m

连接 Open Office 西侧。

包含：

- 1 台大打印机
- 1 台电脑 terminal
- 纸张架
- Employee Handbook
- 1 个侧门
- 1 个可躲藏点

Printer Room 是第一个 Puzzle Room，因此布局必须很简单。

进入后 3 秒内玩家应看到：

> Printer + Computer

---



## Break Room

中心：

> `(10.5, 0, 0)`

尺寸：

> 6m × 7m

包含：

- 3 个 stylized NPC
- 饮水机
- 咖啡台
- 2 张小桌
- Suggestion Box
- 可投掷杯子
- 一条连接 Open Office 的主通道

Rule #2 中 NPC 增加 Workload。

因此 Break Room 出口不要太宽。

Workload 增加后，玩家离开房间时应明显感到行动困难。

---



## Manager Office

中心：

> `(0, 0, -10)`

尺寸：

> 8m × 6m

连接 Open Office 北侧。

前期：

> Locked

完成 Rule #2 后打开。

视觉上应该比普通房间：

- 更高
- 更空
- 更对称
- 更有压迫感

推荐：

- 层高 4m
- Manager Desk 放在远端
- Proposal 放在 Desk 上
- 左右对称展示墙
- 3 个 Evidence 分散在房间内

不要做成迷宫。

重点是：

> Ownership Puzzle

而不是搜索难度。

---



## Meeting Room / Boss Room

中心：

> `(0, 0, 10.5)`

尺寸：

> 10m × 8m

层高：

> 4.5m

包含：

- 1 张长会议桌
- 6–8 个无脸 NPC
- Manager / Director
- 1 个语音门
- 1 个隐藏按钮
- 1 个杯子 / 投掷物
- 3 个 Boss Phase Trigger

Meeting Room 初始锁住。

直到完成 Manager Office。

---



# 6. Open Office 地编细节

不要用传统格子排列填满办公桌。

推荐使用 3 个 Desk Islands。

例如：

```text
   D D                 D D
   D D                 D D


          MAIN PATH


   D D          D D
   D D          D D
```

其中保留：

- 西向 Printer Room 主通道
- 东向 Break Room 主通道
- 北向 Manager Office 主通道
- 南向 Meeting Room 主通道

玩家站在 Open Office 中央时：

应该可以视觉上识别四个方向。

建议每个房间入口有不同 accent color：

- Printer：Dusty Blue
- Break Room：Sage Green
- Manager：Charcoal / Gold
- Meeting Room：Muted Coral

不要用明显游戏 UI 箭头。

用环境配色做导航。

---



# 7. 电梯 / Spawn Area

玩家起点位于：

> Open Office 南侧

位置建议：

`(-3.5, 0, 5)`

电梯：

宽 2.5m。

第一次按按钮：

显示：

> ACCESS DENIED  
> OUTSTANDING TASKS: 3

电梯旁边：

- Compliance Notice
- 打印机第一次发出声音

玩家自然被引导去 Printer Room。

不要在出生时直接把 Printer Room 门放正前方。

应该：

> Sound cue + lighting cue

引导玩家转头。

---



# 8. 第一轮 Visual State

初始场景状态：

## STATE_A — ORDER

关键词：

- 干净
- 对称
- 柔和
- 空
- 舒服

Palette：

- Warm Cream
- Pale Beige
- Dusty Blue
- Sage Green
- Soft Grey

禁止：

- 写实脏污
- Horror blood
- 强噪点
- 破败墙体
- 传统 Backrooms 黄墙

玩家第一印象应该是：

> “这里甚至挺漂亮。”

---



# 9. 第二轮 Visual State

第一次 Rule Broken 后：

## STATE_B — STRANGE

不要把整个场景替换。

通过 runtime 改变：

- 色温降低
- 部分灯关闭
- 走廊略微拉长
- Manager Office 灯亮起
- 少数家具旋转 1–2°
- 植物朝玩家方向旋转
- 某些门位置产生轻微错位
- ambient audio 变化

目标：

> 玩家意识到空间在“观察”她。

---



# 10. 第三轮 Visual State

Rule #2 中 Workload 增加后：

## STATE_C — PRESSURE

Open Office 应支持动态 Spawn Desk。

预先设计：

`PressureDeskSlot[]`

大约 12–20 个隐藏 placement。

每接受一次任务：

spawn 4–6 张桌子。

最终办公室从：

> 宽敞

变成：

> 拥挤

但不要真的完全堵死玩家。

至少保留：

> 0.9m–1.1m 可通行路径。

当玩家第一次选择 NO：

这些动态桌子：

统一快速下沉 / 倒塌 / dissolve。

场景恢复。

---



# 11. 模块化资产清单

第一版 P0 资产：

## Architecture

- `floor_tile_2x2`
- `wall_2m`
- `wall_4m`
- `glass_wall_2m`
- `glass_wall_4m`
- `door_standard`
- `door_glass`
- `ceiling_panel`
- `column`



## Furniture

- `desk_standard`
- `chair_simple`
- `monitor`
- `keyboard`
- `cabinet`
- `meeting_table`
- `meeting_chair`
- `break_table`
- `sofa_or_bench`



## Gameplay

- `printer`
- `terminal`
- `suggestion_box`
- `paper_stack`
- `cup`
- `proposal`
- `employee_handbook`
- `evidence_card`



## Decoration

- `plant_small`
- `plant_large`
- `wall_frame`
- `ceiling_light`
- `desk_lamp`



## Characters

- `npc_generic`
- `manager`
- Rae 当前不需要可见模型

---



# 12. Stylized 美术规则

所有 props 坚持：

> simple geometry + rounded edges + flat material

不要：

- 写实纹理
- scratches
- fabric maps
- wood textures
- realistic metal
- heavy normal maps

推荐：

- 纯色材质
- 少量 Roughness 区别
- Soft AO
- Bevel
- 大形体优先

资产 silhouette 必须清晰。

玩家在 5–8m 外应能立即识别：

- Printer
- Computer
- Chair
- Cup
- Door
- Plant

---



# 13. Material Palette

建议暂时定义固定 Material Tokens。

```ts
MAT_CREAM
MAT_WARM_WHITE
MAT_SAGE
MAT_DUSTY_BLUE
MAT_CORAL
MAT_LAVENDER_GREY
MAT_CHARCOAL
MAT_GOLD
MAT_GLASS
```

不要每个资产自己定义颜色。

统一引用 palette。

这样后期一键换风格。

---



# 14. Lighting

第一版不要复杂灯光。

推荐：

## Ambient

柔和环境光。

## Key Lighting

模拟 overhead office lighting。

使用：

- RectAreaLight
- DirectionalLight

避免：

几十个实时 point light。

## Accent

每个主要房间入口使用轻微不同灯光颜色。

## Manager Office

永远比 Open Office：

> 高对比 + 暗一档



## Meeting Room

Boss 前：

冷。

Ending：

逐渐转暖。

---



# 15. Collision

Collision 与 visual mesh 分离。

统一建立简化 collider：

```text
WallCollider
DeskCollider
DoorCollider
FurnitureCollider
```

小物件默认不阻挡玩家。

以下物件必须 collision：

- 墙
- 门
- Desk
- Cabinet
- Meeting Table
- Printer

以下默认不 collision：

- 植物叶片
- Paper
- Small props
- Monitor
- Decoration

避免玩家被小东西卡住。

---



# 16. Navigation / Manager AI

Manager 使用简单 nav / waypoint 即可。

预定义路线：

```text
Manager Office
↓
North Open Office
↓
Central Aisle
↓
Printer Entrance
↓
Central Aisle
↓
Break Room Entrance
↓
Manager Office
```

确保 Open Office 至少有两个环路。

不要设计成单条走廊。

推荐：

```text
Desk Island A      Desk Island B
      │                  │
      ├──── Main ────────┤
      │                  │
Desk Island C      Desk Island D
```

玩家被追逐时可以：

> 绕桌区甩开 Manager。

---



# 17. Manager Sightline

不要让 Manager 一出门就看到全图。

通过：

- Desk island
- Glass wall
- Cabinet
- Column

打断视线。

推荐 Chase 体验：

Manager 进入 Open Office 后：

玩家至少有：

> 2–3 条逃生路线。

Printer Room 和 Break Room 都可以短暂躲避。

---



# 18. Door State

每扇 Gameplay Door 都必须有独立 ID。

例如：

```text
door_printer
door_break
door_manager
door_meeting
door_elevator
```

支持：

```ts
locked
unlocked
open
closed
disabled
```

不要把 unlock 逻辑写在具体 mesh 中。

---



# 19. Trigger Zones

地图中预设：

```text
trigger_spawn
trigger_rule1_start
trigger_rule1_complete
trigger_manager_spawn_01
trigger_rule2_start
trigger_rule2_complete
trigger_manager_spawn_02
trigger_rule3_start
trigger_boss_start
trigger_boss_phase_02
trigger_boss_phase_03
trigger_ending
```

Trigger 使用 invisible box。

所有剧情逻辑与空间分开。

---



# 20. Scene Hierarchy

推荐：

```text
Scene
│
├── Environment
│   ├── Architecture
│   ├── Floors
│   ├── Walls
│   ├── Doors
│   └── Glass
│
├── Rooms
│   ├── OpenOffice
│   ├── PrinterRoom
│   ├── BreakRoom
│   ├── ManagerOffice
│   └── MeetingRoom
│
├── Props
│   ├── Static
│   ├── Interactive
│   └── Dynamic
│
├── Characters
│   ├── Manager
│   └── NPCs
│
├── Gameplay
│   ├── Triggers
│   ├── Interactables
│   ├── PuzzleObjects
│   └── Checkpoints
│
├── Lighting
│
└── Audio
```

---



# 21. 场景配置数据

尽量不要 hardcode 每个 Desk。

使用 layout config。

例如：

```ts
export const officeLayout = {
  desks: [
    { x: -4, z: -2, rotation: 0 },
    { x: -2, z: -2, rotation: 0 },
    { x: 2, z: -2, rotation: Math.PI },
    { x: 4, z: -2, rotation: Math.PI }
  ]
}
```

动态 Pressure Desk 单独：

```ts
pressureDeskSlots: [...]
```

这样后续可以快速调整。

---



# 22. Runtime Environment State API

场景需预留统一状态接口。

例如：

```ts
setOfficeState("ORDER")
setOfficeState("STRANGE")
setOfficeState("PRESSURE")
setOfficeState("BOSS")
setOfficeState("FREEDOM")
```

状态负责：

- 灯光
- fog
- desk spawn
- prop rotation
- door state
- ambient audio
- material tone

不要在 Puzzle 代码里逐个修改场景对象。

---



# 23. First Pass 不要做的东西

当前 Agent 不要投入时间：

- 高精人物
- Character facial animation
- 真正镜面反射
- 写实材质
- 高精家具
- 完整办公室装饰
- 大量小道具
- 程序化生成地图
- 电梯动画细节
- Advanced volumetric fog
- Fancy UI
- Boss 特效

初版必须先跑通：

> 从电梯 → Printer → Open Office → Break → Manager Office → Meeting Room

---



# 24. Agent 第一阶段交付标准

第一阶段完成后，应可以运行并做到：

1. 第一人称角色出生在电梯前。
2. 可以走遍整个办公室。
3. Printer / Break / Manager / Meeting Room 空间位置清晰。
4. 所有门都有独立 state。
5. 场景 collision 正常。
6. Manager 有一条可走的巡逻路线。
7. Open Office 有可供 Chase 绕行的结构。
8. 所有 Gameplay Trigger 已占位。
9. Pressure Desk Spawn Slot 已预留。
10. 所有材质使用统一 palette。
11. 场景整体已经呈现 stylized pastel office，而不是默认灰盒。

---



# 25. 推荐实际搭建顺序



## Pass 1 — Pure Graybox

只使用：

- White Box
- Grey Floor
- Capsule Player

完成：

- 所有房间
- 走廊
- 门
- Collision
- Manager 路线

先跑一遍。

---



## Pass 2 — Spatial Readability

加入：

- Desk clusters
- Cabinet
- Printer
- Meeting Table
- Break Area

测试：

- 玩家是否迷路
- Manager 是否会卡住
- Chase 是否有路线
- 房间之间距离是否合理

---



## Pass 3 — Stylized Look

统一加入：

- Bevel geometry
- pastel material
- glass
- plants
- rounded furniture
- soft lighting

---



## Pass 4 — Dynamic State

实现：

- ORDER
- STRANGE
- PRESSURE

至少做到：

Rule Broken 后场景有明显变化。

---



# 26. 最关键的地编原则

这个地图不是普通办公室。

它需要同时满足三个目标：

### A. 看起来合理

第一眼像一个设计感很强的办公室。

### B. 玩起来清楚

玩家永远知道：

> “我大概在哪。”



### C. 可以变得不合理

随着 Rae 开始违反规则：

> 空间本身越来越不可信。

因此初始地图必须非常清晰、有秩序。

只有这样后续的：

- Desk 增生
- 比例异常
- 灯光变化
- Door shift
- Manager 出现

才会真正产生冲击。

---



# 27. 一句话执行目标

Agent 当前不要试图“完成游戏场景”。

请先完成一个：

> **可行走、可追逐、可动态改变的 stylized modular office playground。**

如果第一版可以让人在没有任何剧情的情况下：

- 从电梯走到打印室
- 绕着办公桌跑
- 躲 Manager
- 进入会议室

并且空间关系清晰，

那么地编第一阶段就是成功的。