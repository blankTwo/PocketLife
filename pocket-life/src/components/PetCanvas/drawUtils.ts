// 宠物绘制工具函数
import type { PetStage } from '../../types'

// 表情状态
export type MoodState = 'happy' | 'normal' | 'sad'

// 行为动画状态
export type ActionState = 'idle' | 'feed' | 'play' | 'sleep' | null

// 宠物颜色配置（根据进化阶段）
export const STAGE_COLORS: Record<PetStage, string> = {
  baby: '#FFB6C1',    // 粉色
  adult: '#87CEEB',   // 天蓝色
  master: '#FFD700'   // 金色
}

// 宠物大小配置
export const STAGE_SIZES: Record<PetStage, number> = {
  baby: 60,
  adult: 80,
  master: 100
}

// 绘制宠物身体
export function drawBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.beginPath()
  ctx.arc(x, y, size, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.closePath()
}

// 绘制眼睛
export function drawEyes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  moodState: MoodState
) {
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
export function drawMouth(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  moodState: MoodState
) {
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
export function drawBlush(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
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

// 绘制完整宠物
export function drawPet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  stage: PetStage,
  moodState: MoodState
) {
  const size = STAGE_SIZES[stage]
  const color = STAGE_COLORS[stage]

  drawBody(ctx, x, y, size, color)
  drawEyes(ctx, x, y, size, moodState)
  drawMouth(ctx, x, y, size, moodState)

  if (moodState === 'happy') {
    drawBlush(ctx, x, y, size)
  }
}

// 绘制闭眼（睡觉状态）
export function drawClosedEyes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  const eyeOffset = size * 0.3
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3

  // 左眼闭合线
  ctx.beginPath()
  ctx.arc(x - eyeOffset, y - size * 0.1, size * 0.1, 0, Math.PI)
  ctx.stroke()

  // 右眼闭合线
  ctx.beginPath()
  ctx.arc(x + eyeOffset, y - size * 0.1, size * 0.1, 0, Math.PI)
  ctx.stroke()
}

// 绘制食物
export function drawFood(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) {
  ctx.fillStyle = '#FF6B6B'
  ctx.beginPath()
  ctx.arc(x, y, 15, 0, Math.PI * 2)
  ctx.fill()
}

// 绘制 Zzz 睡眠符号
export function drawZzz(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number
) {
  ctx.fillStyle = '#666'
  ctx.font = '16px Arial'
  const offset = Math.sin(frame * 0.1) * 5
  ctx.fillText('Z', x, y - offset)
  ctx.fillText('z', x + 12, y - 15 - offset)
  ctx.fillText('z', x + 20, y - 28 - offset)
}
