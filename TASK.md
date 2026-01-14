# 📋 电子宠物小程序 MVP 任务清单

> 按开发流程划分，先跑通核心闭环，再逐步完善

---

## 阶段一：项目初始化

### 1.1 开发环境搭建
- [ ] 初始化 Taro 4.x 项目（React + TypeScript）
- [ ] 配置微信小程序云开发环境
- [ ] 配置 Zustand 状态管理
- [ ] 配置 ESLint + Prettier 代码规范

### 1.2 项目结构规划
- [ ] 创建目录结构（pages / components / store / services / utils）
- [ ] 创建云函数目录结构
- [ ] 定义 TypeScript 类型文件（Pet 实体等）

### 1.3 云数据库设计
- [ ] 创建 pets 集合
- [ ] 设置 userId 唯一索引
- [ ] 定义字段结构及初始值

---

## 阶段二：核心闭环（最小可运行版本）

### 2.1 云函数 - 基础接口
- [ ] getPet：获取/创建宠物（含时间结算 + 死亡检测 + 进化检测）
- [ ] doAction：执行行为（喂食/玩耍/睡觉）
- [ ] reborn：重生接口

### 2.2 核心工具函数
- [ ] settle()：时间衰减结算
- [ ] checkDeath()：死亡判定
- [ ] checkEvolution()：进化判定
- [ ] clamp()：数值边界处理

### 2.3 前端 - 主页面
- [ ] 宠物状态展示（hunger / mood / energy 数值）
- [ ] 三个行为按钮（喂食 / 玩耍 / 睡觉）
- [ ] 按钮点击调用云函数
- [ ] 状态更新后刷新 UI

### 2.4 前端 - 状态管理
- [ ] Zustand store 设计（petStore）
- [ ] 宠物数据获取与缓存
- [ ] loading / error 状态处理

### 2.5 闭环验证
- [ ] 进入小程序 → 显示宠物状态
- [ ] 点击按钮 → 数值变化
- [ ] 关闭再打开 → 时间衰减生效

---

## 阶段三：功能完善

### 3.1 宠物创建流程
- [ ] 新用户引导页
- [ ] 宠物命名输入（2~6 字符限制）
- [ ] 创建成功跳转主页

### 3.2 死亡与重生
- [ ] 死亡状态 UI（禁用按钮 + 提示文案）
- [ ] 重新开始按钮
- [ ] 重生后重置状态

### 3.3 进化系统
- [ ] 进化阶段展示（baby / adult / master）
- [ ] 进化时的 UI 反馈（可选：简单提示）

### 3.4 行为冷却
- [ ] 全局 5s 冷却逻辑
- [ ] 按钮置灰 + 倒计时提示

### 3.5 UI 状态映射
- [ ] 三级状态表现（危险 / 一般 / 良好）
- [ ] 数值对应颜色或表情变化

---

## 阶段四：优化收尾

### 4.1 异常处理
- [ ] 前端按钮防抖（300ms）
- [ ] 云函数超时处理（10s）
- [ ] 统一错误提示 UI

### 4.2 并发控制
- [ ] 云函数乐观锁实现
- [ ] 版本号冲突重试

### 4.3 体验优化
- [ ] 操作 loading 态
- [ ] 数值变化动画（可选）
- [ ] 页面 onShow 自动刷新状态

### 4.4 代码质量
- [ ] 关键逻辑中文注释
- [ ] 类型定义完善
- [ ] 删除无用代码

---

## 📝 补充说明

### 明确不做（V1 边界）
- 多宠物系统
- 装备 / 皮肤
- 商城
- 任务系统
- 好友 / 社交
- 战斗系统
- 订阅消息提醒

### 技术约定
- 数值存储取整（Math.floor）
- 服务器时间优先
- 严禁前端直接修改数值

### 用户数据隔离
- 使用微信用户 **openid** 作为唯一标识
- 云函数通过 `cloud.getWXContext().OPENID` 获取
- 一个 openid 对应一只宠物
- 数据库查询必须带 openid 条件，确保用户只能访问自己的数据

---

## 📊 数据库字段清单

### pets 集合

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _id | string | 是 | 云数据库自动生成 |
| openid | string | 是 | 微信用户唯一标识（建唯一索引） |
| name | string | 是 | 宠物名称（2~6 字符） |
| stage | string | 是 | 进化阶段：baby / adult / master |
| hunger | number | 是 | 饥饿值（0~100，整数） |
| mood | number | 是 | 心情值（0~100，整数） |
| energy | number | 是 | 精力值（0~100，整数） |
| lastUpdate | number | 是 | 上次结算时间戳（毫秒） |
| lastActionAt | number | 是 | 上次操作时间戳（用于冷却） |
| createdAt | number | 是 | 宠物创建时间戳 |
| goodStateStartAt | number | 否 | 高状态起始时间（用于进化判定） |
| dead | boolean | 是 | 是否死亡，默认 false |
| deadAt | number | 否 | 死亡时间戳 |
| version | number | 是 | 版本号（用于乐观锁），默认 0 |

### 初始值

```javascript
{
  openid: "用户openid",
  name: "用户输入",
  stage: "baby",
  hunger: 100,
  mood: 100,
  energy: 100,
  lastUpdate: Date.now(),
  lastActionAt: 0,
  createdAt: Date.now(),
  goodStateStartAt: null,
  dead: false,
  deadAt: null,
  version: 0
}
```

### 索引设计

- **唯一索引**：openid（确保一人一宠）
- **普通索引**：dead（可选，用于统计）

---

文档版本：v1.1
