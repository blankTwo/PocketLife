// 宠物 Canvas 组件
const drawUtils = require('../../utils/drawUtils')

const { STAGE_COLORS, STAGE_SIZES, drawBody, drawEyes, drawMouth, drawBlush } = drawUtils

Component({
  properties: {
    stage: { type: String, value: 'baby' },
    mood: { type: Number, value: 100 },
    hunger: { type: Number, value: 100 },
    energy: { type: Number, value: 100 },
    action: { type: String, value: null },
    dead: { type: Boolean, value: false }
  },

  data: {
    ctx: null,
    canvas: null,
    frame: 0,
    animationId: null
  },

  lifetimes: {
    attached() {
      this.initCanvas()
    },
    detached() {
      this.stopAnimation()
    }
  },

  observers: {
    'action': function(action) {
      // action 变化时重置帧计数
      this.setData({ frame: 0 })
    }
  },

  methods: {
    // 初始化 Canvas
    initCanvas() {
      const query = this.createSelectorQuery()
      query.select('#petCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0] && res[0].node) {
            const canvas = res[0].node
            const ctx = canvas.getContext('2d')
            const dpr = wx.getSystemInfoSync().pixelRatio
            canvas.width = 300 * dpr
            canvas.height = 300 * dpr
            ctx.scale(dpr, dpr)
            this.data.ctx = ctx
            this.data.canvas = canvas
            this.startAnimation()
          }
        })
    },

    // 启动动画
    startAnimation() {
      const animate = () => {
        this.draw()
        this.data.frame++
        this.data.animationId = this.data.canvas.requestAnimationFrame(animate)
      }
      animate()
    },

    // 停止动画
    stopAnimation() {
      if (this.data.animationId && this.data.canvas) {
        this.data.canvas.cancelAnimationFrame(this.data.animationId)
      }
    },

    // 获取表情状态
    getMoodState() {
      const { mood, hunger, energy } = this.properties
      const avg = (mood + hunger + energy) / 3
      if (avg <= 30) return 'sad'
      if (avg <= 60) return 'normal'
      return 'happy'
    },

    // 绘制闭眼
    drawClosedEyes(ctx, x, y, size) {
      const eyeOffset = size * 0.3
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(x - eyeOffset, y - size * 0.1, size * 0.1, 0, Math.PI)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x + eyeOffset, y - size * 0.1, size * 0.1, 0, Math.PI)
      ctx.stroke()
    },

    // 绘制食物
    drawFood(ctx, x, y) {
      ctx.fillStyle = '#FF6B6B'
      ctx.beginPath()
      ctx.arc(x, y, 15, 0, Math.PI * 2)
      ctx.fill()
    },

    // 绘制 Zzz
    drawZzz(ctx, x, y, frame) {
      ctx.fillStyle = '#666'
      ctx.font = '16px Arial'
      const offset = Math.sin(frame * 0.1) * 5
      ctx.fillText('Z', x, y - offset)
      ctx.fillText('z', x + 12, y - 15 - offset)
      ctx.fillText('z', x + 20, y - 28 - offset)
    },

    // 绘制完整宠物
    drawPet(ctx, x, y, stage, moodState) {
      const size = STAGE_SIZES[stage]
      const color = STAGE_COLORS[stage]
      drawBody(ctx, x, y, size, color)
      drawEyes(ctx, x, y, size)
      drawMouth(ctx, x, y, size, moodState)
      if (moodState === 'happy') {
        drawBlush(ctx, x, y, size)
      }
    },

    // 绘制一帧
    draw() {
      const ctx = this.data.ctx
      if (!ctx) return

      const { stage, action, dead } = this.properties
      const frame = this.data.frame
      const centerX = 150
      const centerY = 150

      // 清空画布
      ctx.clearRect(0, 0, 300, 300)

      // 死亡状态
      if (dead) {
        const size = STAGE_SIZES[stage]
        ctx.fillStyle = '#999'
        ctx.beginPath()
        ctx.arc(centerX, centerY, size, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#666'
        ctx.font = '20px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('×  ×', centerX, centerY)
        return
      }

      const moodState = this.getMoodState()
      const size = STAGE_SIZES[stage]
      const color = STAGE_COLORS[stage]

      // 根据行为绘制不同动画
      if (action === 'sleep') {
        drawBody(ctx, centerX, centerY, size, color)
        this.drawClosedEyes(ctx, centerX, centerY, size)
        drawMouth(ctx, centerX, centerY, size, 'normal')
        this.drawZzz(ctx, centerX + size, centerY - size, frame)
      } else if (action === 'feed') {
        const progress = Math.min(frame / 30, 1)
        const foodX = 50 + progress * (centerX - 50)
        const foodY = 50 + progress * (centerY - 50)
        this.drawPet(ctx, centerX, centerY, stage, 'happy')
        if (progress < 1) this.drawFood(ctx, foodX, foodY)
      } else if (action === 'play') {
        const bounce = Math.abs(Math.sin(frame * 0.2)) * 20
        this.drawPet(ctx, centerX, centerY - bounce, stage, 'happy')
      } else {
        const breath = Math.sin(frame * 0.05) * 3
        this.drawPet(ctx, centerX, centerY + breath, stage, moodState)
      }
    }
  }
})
