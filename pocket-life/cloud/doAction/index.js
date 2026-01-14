// 云函数入口文件：执行宠物行为
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const petsCollection = db.collection('pets')

// 行为类型
const ACTION_TYPES = {
  FEED: 'feed',
  PLAY: 'play',
  SLEEP: 'sleep'
}

// 冷却时间（毫秒）
const COOLDOWN = 5000

// 数值边界处理
function clamp(value, min, max) {
  return Math.floor(Math.max(min, Math.min(max, value)))
}

// 时间衰减结算
function settle(pet, now) {
  const delta = (now - pet.lastUpdate) / 60000
  if (delta < 1) return pet
  const cappedDelta = Math.min(delta, 1440)

  pet.hunger = clamp(pet.hunger - cappedDelta * 1, 0, 100)
  pet.mood = clamp(pet.mood - cappedDelta * 0.5, 0, 100)
  pet.energy = clamp(pet.energy - cappedDelta * 0.3, 0, 100)
  pet.lastUpdate = now

  return pet
}

// 死亡判定
function checkDeath(pet, now) {
  if (pet.dead) return pet
  if (pet.hunger <= 0 && pet.mood <= 0 && pet.energy <= 0) {
    pet.dead = true
    pet.deadAt = now
  }
  return pet
}

// 进化判定
function checkEvolution(pet, now) {
  if (pet.dead) return pet

  const age = now - pet.createdAt
  const ONE_DAY = 24 * 60 * 60 * 1000

  if (pet.stage === 'baby' && age >= ONE_DAY) {
    pet.stage = 'adult'
  }

  // 更新高状态时间
  if (pet.hunger > 80 && pet.mood > 80) {
    if (!pet.goodStateStartAt) {
      pet.goodStateStartAt = now
    }
  } else {
    pet.goodStateStartAt = null
  }

  if (pet.stage === 'adult' && pet.goodStateStartAt) {
    const goodDuration = now - pet.goodStateStartAt
    if (goodDuration >= ONE_DAY) {
      pet.stage = 'master'
    }
  }

  return pet
}

// 执行行为
function applyAction(pet, actionType) {
  switch (actionType) {
    case ACTION_TYPES.FEED:
      pet.hunger = clamp(pet.hunger + 20, 0, 100)
      pet.mood = clamp(pet.mood + 5, 0, 100)
      break
    case ACTION_TYPES.PLAY:
      pet.mood = clamp(pet.mood + 20, 0, 100)
      pet.energy = clamp(pet.energy - 10, 0, 100)
      pet.hunger = clamp(pet.hunger - 5, 0, 100)
      break
    case ACTION_TYPES.SLEEP:
      pet.energy = 100
      break
  }
  return pet
}

// 云函数入口
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { actionType } = event
  const now = Date.now()

  // 校验行为类型
  if (!Object.values(ACTION_TYPES).includes(actionType)) {
    return { success: false, error: '无效的行为类型' }
  }

  try {
    // 查询宠物
    const { data } = await petsCollection.where({ openid }).get()
    if (data.length === 0) {
      return { success: false, error: '宠物不存在' }
    }

    let pet = data[0]

    // 检查死亡状态
    if (pet.dead) {
      return { success: false, error: '宠物已离开', data: pet }
    }

    // 检查冷却
    if (now - pet.lastActionAt < COOLDOWN) {
      return { success: false, error: '操作太频繁，请稍后再试', data: pet }
    }

    // 核心流程：先结算 -> 再操作 -> 检查死亡 -> 检查进化
    pet = settle(pet, now)
    pet = applyAction(pet, actionType)
    pet = checkDeath(pet, now)
    pet = checkEvolution(pet, now)
    pet.lastActionAt = now

    // 乐观锁更新
    const { _id, ...updateData } = pet
    const updateResult = await petsCollection.doc(_id).update({
      data: {
        ...updateData,
        version: _.inc(1)
      }
    })

    if (updateResult.stats.updated === 0) {
      return { success: false, error: '数据冲突，请重试' }
    }

    return { success: true, data: pet }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
