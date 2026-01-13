# 电子宠物小程序 MVP 功能拆解

> 目标：用**最小可玩闭环**做出一个“有生命感”的电子宠物产品，而不是功能堆砌型 Demo。

---

## 一、设计原则（必须满足）

1. **持续反馈**：宠物状态会变化，不是静态展示
2. **操作有意义**：每次操作都会产生正负影响
3. **时间感知**：离开再回来，世界已经不同

> 只要满足这三点，就已经是合格的电子宠物。

---

## 二、MVP 模块总览

MVP 只保留 6 个核心模块：

1. 宠物基础状态
2. 行为系统
3. 时间衰减系统
4. 进化阶段
5. 存档系统
6. 死亡 & 重生机制

不做任何附加系统（商城 / 任务 / 社交 等）。

---

## 三、模块 1：宠物基础状态

这是整个系统的“心脏”。

### 必须字段

- `id`
- `name`
- `stage`：baby | adult | master
- `hunger`：饥饿值（0~100）
- `mood`：心情值（0~100）
- `energy`：精力值（0~100）
- `lastUpdate`：上次结算时间戳

### 设计原则

- 全部数值化（不使用抽象状态）
- 统一 0~100 区间
- 所有玩法围绕这 3 个数值展开

---

## 四、模块 2：行为系统

### 设计目标

- 所有操作**可预测、有代价、有反馈**
- 必须与时间衰减系统联动（操作前先结算）
- 行为结果**原子化**，避免叠加漏洞

---

### 行为清单（MVP）

仅保留 3 个：

| 行为 | 正面影响 | 负面影响 |
|------|----------|----------|
| 喂食 | hunger +20, mood +5 | 无 |
| 玩耍 | mood +20 | energy -10, hunger -5 |
| 睡觉 | energy = 100 | 无 |

> 所有数值最终 clamp 到 0~100。

---

### 统一执行流程（非常重要）

所有行为**必须走同一流程**：

```
function doAction(pet, actionType):
  now = getServerTime()
  pet = settle(pet, now)   // 时间衰减结算

  switch actionType:
    case FEED:
      pet.hunger += 20
      pet.mood   += 5
    case PLAY:
      pet.mood   += 20
      pet.energy -= 10
      pet.hunger -= 5
    case SLEEP:
      pet.energy = 100

  pet.hunger = clamp(pet.hunger, 0, 100)
  pet.mood   = clamp(pet.mood, 0, 100)
  pet.energy = clamp(pet.energy, 0, 100)

  save(pet)
  return pet
```

**顺序不可变：先结算 → 再操作 → 再保存**

---

### 行为冷却（可选但推荐）

防止刷操作：

```
lastActionAt
cooldown = 5s

if now - lastActionAt < cooldown:
   reject()
```

---

### 行为失败规则

以下情况直接拒绝：

- pet.dead === true
- 数据未加载完成
- 正在结算中（并发锁）

---

### 并发控制（工程重点）

必须保证：

- 同一时间只允许一次行为
- 云函数层加锁 / 乐观锁

示意：

```
if version mismatch:
   retry
```

---

### 与 UI 的数据流

```
按钮点击
  ↓
call doAction
  ↓
云端结算 + 更新
  ↓
返回最新 pet
  ↓
setState + 动画反馈
```

---

### 设计注意点

1. **严禁前端直接改数值**（必须走服务端）
2. **所有操作前必须结算时间衰减**
3. **行为数值写死，不允许配置化**（V1 简化）
4. **一次操作 = 一次存储**，不做批处理

---

### 扩展预留

后续可以在此模块扩展：

- 洗澡
- 治疗
- 外出

但必须遵循同一流程模板。


MVP 只保留 3 个行为入口：

| 行为 | 正面影响 | 负面影响 |
|------|----------|----------|
| 喂食 | hunger +20 | mood +5 |
| 玩耍 | mood +20 | energy -10, hunger -5 |
| 睡觉 | energy = 100 | 无 |

### 设计要求

- 每个行为必须**有代价**
- 不允许“无脑最优解”操作

---

## 五、模块 3：时间衰减系统（核心）

### 设计目标

- **离线可结算**：用户不在线也会发生变化
- **无定时器**：不依赖 setInterval / 后台任务
- **确定性强**：同一时间差必然得到同一结果
- **低资源消耗**：仅在打开/操作时结算

### 核心思想

> 以 `lastUpdate` 为基准，用 **当前时间 - 上次结算时间** 的差值来计算衰减。

### 数据依赖

- `lastUpdate: number`（毫秒时间戳）
- 当前系统时间 `now: number`

### 衰减公式模型

- 每分钟衰减：
  - hunger：-1
  - mood：-0.5
  - energy：-0.3

- 计算公式：

```
deltaMinutes = (now - lastUpdate) / 60000

hunger = hunger - deltaMinutes * 1
mood   = mood   - deltaMinutes * 0.5
energy = energy - deltaMinutes * 0.3
```

- 所有数值最终 **clamp 到 0 ~ 100** 区间。

### 结算时机

- 小程序启动时
- 页面 onShow 时
- 任意行为操作前

> 原则：**先结算，再操作**

### 伪代码流程

```
function settle(pet, now):
  delta = (now - pet.lastUpdate) / 60000

  pet.hunger -= delta * 1
  pet.mood   -= delta * 0.5
  pet.energy -= delta * 0.3

  pet.hunger = clamp(pet.hunger, 0, 100)
  pet.mood   = clamp(pet.mood, 0, 100)
  pet.energy = clamp(pet.energy, 0, 100)

  pet.lastUpdate = now
  return pet
```

### 设计注意点

1. **绝不使用定时器**（避免性能与后台限制问题）
2. **一次结算到底**（不拆多段）
3. **操作前强制结算**（防止时间叠加漏洞）
4. **服务器时间优先**（防止本地时间作弊）

### 边界处理

- 如果 `deltaMinutes < 1`：可以不处理（微优化）
- 如果 `deltaMinutes > 1440`（24h）：可封顶处理，防止极端值

### 与死亡系统的关系

结算完成后立即检查：

```
if hunger <= 0 && mood <= 0 && energy <= 0:
   pet.dead = true
```

时间衰减是**死亡触发的唯一来源**。

---

## 五.1 时间衰减系统的定位

这是整个电子宠物项目的**灵魂模块**：

- 没有它 → 普通小游戏
- 有了它 → 陪伴型产品

> 一切行为、进化、死亡，都必须以它为前置条件。


### 核心思想

> 不使用定时器、不后台轮询，全部基于 `lastUpdate` 与当前时间差计算。

### 衰减模型

- 每分钟：
  - hunger -1
  - mood -0.5
  - energy -0.3

### 特性

- 离线也会变化
- 打开小程序时一次性结算
- 极低资源消耗

---

## 六、模块 4：进化阶段

提供长期目标感。

### 规则设计

- `baby → adult`：存活 ≥ 24 小时
- `adult → master`：连续 24 小时 hunger > 80 且 mood > 80

### 原则

- 时间 + 状态双条件
- 规则可预测、可理解

---

## 七、模块 5：存档系统

### MVP 规则

- 一个用户只拥有一只宠物
- 使用 openid 作为唯一键
- 进入即自动创建

> V1 不做：多宠物 / 图鉴 / 收集系统

---

## 八、模块 6：死亡 & 重生

### 设计目标

- 提供明确的失败反馈
- 强化情绪连接（“它离开了”）
- 保证系统可恢复，不产生死档

---

### 死亡判定规则

```
if hunger <= 0 && mood <= 0 && energy <= 0:
   pet.dead = true
```

> **必须是三项同时为 0**，避免误杀。

---

### 死亡结算流程

```
function checkDeath(pet):
  if pet.dead:
     return pet

  if pet.hunger <= 0 && pet.mood <= 0 && pet.energy <= 0:
     pet.dead = true
     pet.deadAt = now
     save(pet)

  return pet
```

> 所有行为 & 时间结算后 **必须调用一次**。

---

### UI 表现规则

- 禁用所有操作按钮
- 显示：宠物已离开提示
- 提供：重新开始 按钮

---

### 重生流程

```
function reborn(userId):
  delete old pet
  create new pet (初始值)
  return new pet
```

初始值统一：

- hunger = 100
- mood = 100
- energy = 100
- stage = baby

---

### 设计注意点

1. 死亡状态**必须持久化**
2. 不允许在死亡状态下做任何行为
3. 重生 = 新实例，不复用旧数据

---

## 九、模块 7：进化系统（状态机设计）

### 设计目标

- 提供长期目标
- 行为产生积累价值
- 规则可预测、可理解

---

### 状态定义

```
baby  -> adult  -> master
```

---

### 状态机模型

```
[baby]
   |
   | 存活 >= 24h
   v
[adult]
   |
   | 连续 24h hunger > 80 && mood > 80
   v
[master]
```

---

### 进化判定流程

```
function checkEvolution(pet):
  if pet.stage == 'baby' && pet.age >= 24h:
     pet.stage = 'adult'

  if pet.stage == 'adult' && pet.goodStateDuration >= 24h:
     pet.stage = 'master'

  save(pet)
  return pet
```

---

### 关键字段

- `createdAt`：创建时间
- `goodStateStartAt`：高状态起始时间

---

### goodState 维护逻辑

```
if hunger > 80 && mood > 80:
   if goodStateStartAt is null:
      goodStateStartAt = now
else:
   goodStateStartAt = null
```

`goodStateDuration = now - goodStateStartAt`

---

### 触发时机

- 时间衰减结算后
- 行为操作后

---

### 设计注意点

1. 进化必须**单向不可逆**
2. 只允许跨一级
3. 进化后立即保存

---

## 十、模块 8：存档系统

### 设计目标

- 强归属感
- 数据安全
- 结构稳定

---

### 数据模型

```
Pet {
  _id
  userId
  name
  stage
  hunger
  mood
  energy
  lastUpdate
  createdAt
  goodStateStartAt
  dead
  deadAt
}
```

---

### 初始化流程

```
function getOrCreatePet(userId):
  pet = find by userId
  if not exists:
     create new pet
  return pet
```

---

### 访问流程（统一入口）

```
onAppEnter:
  pet = getOrCreatePet(userId)
  pet = settle(pet)
  pet = checkDeath(pet)
  pet = checkEvolution(pet)
  return pet
```

---

### 并发控制

- userId 唯一索引
- 更新必须带版本号
- 冲突重试一次

---

### 设计注意点

1. 任何修改都必须走服务端
2. 不允许前端直写
3. 每次返回必须是最新状态

---

## 十一、工程总流程图（汇总）

```
进入小程序
   ↓
getOrCreatePet
   ↓
settle 时间衰减
   ↓
checkDeath
   ↓
checkEvolution
   ↓
返回 pet
   ↓
UI 渲染
```


这是“情绪钩子”，不能省。

### 死亡判定

- hunger ≤ 0
- mood ≤ 0
- energy ≤ 0

全部满足 → 死亡

### 行为

- 显示离开提示
- 提供“重新开始”按钮
- 数据重置

---

## 九、MVP 边界（明确不做）

以下功能 **全部排除在 V1 之外**：

- 多宠物系统
- 装备 / 皮肤
- 商城
- 任务系统
- 好友 / 社交
- 战斗系统

> 原因：这些会拖垮节奏，无法快速闭环。

---

## 十、用户体验闭环

理想闭环流程：

1. 进入小程序
2. 看到宠物状态变化
3. 发现它饿了
4. 喂食 → 数值变化 → 表情变化
5. 离开
6. 数小时后回来
7. 发现状态更差 / 或进化

只要这个跑通，项目就成立。

---

## 十一、版本目标

V1 目标不是“丰富”，而是：

> **让用户产生“它在等我”的错觉。**

---

文档版本：v1.0

