// 云函数入口文件：获取/创建宠物
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const petsCollection = db.collection('pets')

// 数值边界处理
function clamp(value, min, max) {
  return Math.floor(Math.max(min, Math.min(max, value)))
}

// 时间衰减结算
function settle(pet, now) {
  const delta = (now - pet.lastUpdate) / 60000 // 转换为分钟

  // 边界处理：小于1分钟不处理，大于24小时封顶
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

  // baby -> adult：存活 >= 24h
  if (pet.stage === 'baby' && age >= ONE_DAY) {
    pet.stage = 'adult'
  }

  // 更新 goodStateStartAt
  if (pet.hunger > 80 && pet.mood > 80) {
    if (!pet.goodStateStartAt) {
      pet.goodStateStartAt = now
    }
  } else {
    pet.goodStateStartAt = null
  }

  // adult -> master：连续24h高状态
  if (pet.stage === 'adult' && pet.goodStateStartAt) {
    const goodDuration = now - pet.goodStateStartAt
    if (goodDuration >= ONE_DAY) {
      pet.stage = 'master'
    }
  }

  return pet
}

// 创建新宠物
function createNewPet(openid, now) {
  return {
    openid,
    name: '小宠',
    stage: 'baby',
    hunger: 100,
    mood: 100,
    energy: 100,
    lastUpdate: now,
    lastActionAt: 0,
    createdAt: now,
    goodStateStartAt: null,
    dead: false,
    deadAt: null,
    version: 0
  }
}

// 云函数入口
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const now = Date.now()

  try {
    // 查询用户宠物
    const { data } = await petsCollection.where({ openid }).get()

    let pet
    let isNew = false

    if (data.length === 0) {
      // 创建新宠物
      pet = createNewPet(openid, now)
      const result = await petsCollection.add({ data: pet })
      pet._id = result._id
      isNew = true
    } else {
      // 获取已有宠物并结算
      pet = data[0]
      pet = settle(pet, now)
      pet = checkDeath(pet, now)
      pet = checkEvolution(pet, now)

      // 更新数据库
      const { _id, ...updateData } = pet
      await petsCollection.doc(_id).update({ data: updateData })
    }

    return {
      success: true,
      data: pet,
      isNew
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
