// 主页面逻辑
const STAGE_TEXT = {
  baby: '幼年期',
  adult: '成年期',
  master: '大师期'
}

// 获取状态等级
function getStateLevel(value) {
  if (value <= 30) return 'danger'
  if (value <= 60) return 'normal'
  return 'good'
}

Page({
  data: {
    pet: {
      name: '小宠',
      stage: 'baby',
      hunger: 100,
      mood: 100,
      energy: 100,
      dead: false
    },
    stageText: '幼年期',
    hungerLevel: 'good',
    moodLevel: 'good',
    energyLevel: 'good',
    currentAction: null,
    loading: true,
    cooldown: false
  },

  onLoad() {
    this.fetchPet()
  },

  onShow() {
    // 页面显示时刷新数据
    if (!this.data.loading) {
      this.fetchPet()
    }
  },

  // 获取宠物数据
  async fetchPet() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({ name: 'getPet' })
      if (res.result.success) {
        this.updatePetData(res.result.data)
      } else {
        wx.showToast({ title: '获取失败', icon: 'none' })
      }
    } catch (err) {
      console.error('获取宠物失败:', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 更新宠物数据到页面
  updatePetData(pet) {
    this.setData({
      pet,
      stageText: STAGE_TEXT[pet.stage] || '未知',
      hungerLevel: getStateLevel(pet.hunger),
      moodLevel: getStateLevel(pet.mood),
      energyLevel: getStateLevel(pet.energy)
    })
  },

  // 执行行为
  async doAction(action) {
    if (this.data.cooldown || this.data.loading) return

    this.setData({ currentAction: action, cooldown: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'doAction',
        data: { action }
      })

      if (res.result.success) {
        this.updatePetData(res.result.data)
      } else {
        wx.showToast({ title: res.result.error || '操作失败', icon: 'none' })
      }
    } catch (err) {
      console.error('操作失败:', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
    }

    // 动画延迟
    setTimeout(() => {
      this.setData({ currentAction: null })
    }, 1500)

    // 冷却时间 5 秒
    setTimeout(() => {
      this.setData({ cooldown: false })
    }, 5000)
  },

  // 喂食
  handleFeed() {
    this.doAction('feed')
  },

  // 玩耍
  handlePlay() {
    this.doAction('play')
  },

  // 睡觉
  handleSleep() {
    this.doAction('sleep')
  },

  // 重生
  async handleReborn() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({ name: 'reborn' })
      if (res.result.success) {
        this.updatePetData(res.result.data)
        wx.showToast({ title: '重生成功', icon: 'success' })
      } else {
        wx.showToast({ title: '重生失败', icon: 'none' })
      }
    } catch (err) {
      console.error('重生失败:', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
