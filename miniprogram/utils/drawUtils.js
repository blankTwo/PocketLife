// 宠物绘制工具函数

// 宠物颜色配置（根据进化阶段）
const STAGE_COLORS = {
  baby: '#FFB6C1',    // 粉色
  adult: '#87CEEB',   // 天蓝色
  master: '#FFD700'   // 金色
}

// 宠物大小配置
const STAGE_SIZES = {
  baby: 60,
  adult: 80,
  master: 100
}

// 绘制宠物身体
function drawBody(ctx, x, y, size, color) {
  ctx.beginPath()
  ctx.arc(x, y, size, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.closePath()
}

// 绘制眼睛
function drawEyes(ctx, x, y, size) {
  const eyeOffset = size * 0.3
  const eyeSize = size * 0.15

  ctx.fillStyle = '#333'

  // 左眼
  ctx.beginPath()
  ctx.arc(x - eyeOffset, y - size * 0.1, eyeSize, 0, Math.PI * 2)
  ctx.fill()

  // 右眼
  ctx.beginPath()
  ctx.arc(x + eyeOffset, y - size * 0.1, eyeSize, 0, Math.PI * 2)
  ctx.fill()
}

// 绘制嘴巴
function drawMouth(ctx, x, y, size, moodState) {
  const mouthY = y + size * 0.3
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3
  ctx.beginPath()

  if (moodState === 'happy') {
    // 开心：微笑弧线
    ctx.arc(x, mouthY - size * 0.1, size * 0.25, 0.1 * Math.PI, 0.9 * Math.PI)
  } else if (moodState === 'sad') {
    // 难过：倒弧线
    ctx.arc(x, mouthY + size * 0.15, size * 0.2, 1.1 * Math.PI, 1.9 * Math.PI)
  } else {
    // 普通：直线
    ctx.moveTo(x - size * 0.15, mouthY)
    ctx.lineTo(x + size * 0.15, mouthY)
  }

  ctx.stroke()
}

// 绘制腮红
function drawBlush(ctx, x, y, size) {
  ctx.fillStyle = 'rgba(255, 150, 150, 0.5)'
  const blushY = y + size * 0.15
  const blushOffset = size * 0.5

  ctx.beginPath()
  ctx.ellipse(x - blushOffset, blushY, size * 0.12, size * 0.08, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.ellipse(x + blushOffset, blushY, size * 0.12, size * 0.08, 0, 0, Math.PI * 2)
  ctx.fill()
}

module.exports = {
  STAGE_COLORS,
  STAGE_SIZES,
  drawBody,
  drawEyes,
  drawMouth,
  drawBlush
}
