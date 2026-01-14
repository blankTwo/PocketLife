// 云函数入口文件：宠物重生
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const petsCollection = db.collection('pets')

// 云函数入口
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const now = Date.now()

  try {
    // 删除旧宠物
    await petsCollection.where({ openid }).remove()

    // 创建新宠物
    const newPet = {
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

    const result = await petsCollection.add({ data: newPet })
    newPet._id = result._id

    return { success: true, data: newPet }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
