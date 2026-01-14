// Canvas 宠物组件
import { Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useRef, useCallback } from 'react'
import type { PetStage } from '../../types'
import {
  drawPet,
  drawClosedEyes,
  drawFood,
  drawZzz,
  STAGE_SIZES,
  STAGE_COLORS,
  drawBody,
  drawMouth,
  type MoodState
} from './drawUtils'

interface PetCanvasProps {
  stage: PetStage
  mood: number
  hunger: number
  energy: number
  action: 'idle' | 'feed' | 'play' | 'sleep' | null
  dead: boolean
}

export default function PetCanvas({ stage, mood, hunger, energy, action, dead }: PetCanvasProps) {
  const canvasId = 'petCanvas'
  const animationRef = useRef<number>(0)
  const frameRef = useRef<number>(0)

  // 获取表情状态
  const getMoodState = useCallback((): MoodState => {
    const avg = (mood + hunger + energy) / 3
    if (avg <= 30) return 'sad'
    if (avg <= 60) return 'normal'
    return 'happy'
  }, [mood, hunger, energy])

  // 获取 Canvas 上下文
  const getCtx = useCallback(async () => {
    const query = Taro.createSelectorQuery()
    return new Promise<CanvasRenderingContext2D | null>((resolve) => {
      query.select(`#${canvasId}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]?.node) {
            const canvas = res[0].node
            const ctx = canvas.getContext('2d')
            const dpr = Taro.getSystemInfoSync().pixelRatio
            canvas.width = 300 * dpr
            canvas.height = 300 * dpr
            ctx.scale(dpr, dpr)
            resolve(ctx)
          } else {
            resolve(null)
          }
        })
    })
  }, [])

  // 绘制一帧
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const centerX = 150
    const centerY = 150
    const frame = frameRef.current

    // 清空画布
    ctx.clearRect(0, 0, 300, 300)

    // 死亡状态：灰色宠物
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

    const moodState = getMoodState()
    const size = STAGE_SIZES[stage]
    const color = STAGE_COLORS[stage]

    // 根据行为绘制不同动画
    if (action === 'sleep') {
      // 睡觉：闭眼 + Zzz
      drawBody(ctx, centerX, centerY, size, color)
      drawClosedEyes(ctx, centerX, centerY, size)
      drawMouth(ctx, centerX, centerY, size, 'normal')
      drawZzz(ctx, centerX + size, centerY - size, frame)
    } else if (action === 'feed') {
      // 喂食：食物飞入动画
      const progress = Math.min(frame / 30, 1)
      const foodX = 50 + progress * (centerX - 50)
      const foodY = 50 + progress * (centerY - 50)
      drawPet(ctx, centerX, centerY, stage, 'happy')
      if (progress < 1) drawFood(ctx, foodX, foodY)
    } else if (action === 'play') {
      // 玩耍：跳跃动画
      const bounce = Math.abs(Math.sin(frame * 0.2)) * 20
      drawPet(ctx, centerX, centerY - bounce, stage, 'happy')
    } else {
      // 默认：呼吸动画
      const breath = Math.sin(frame * 0.05) * 3
      drawPet(ctx, centerX, centerY + breath, stage, moodState)
    }

    frameRef.current++
  }, [stage, dead, action, getMoodState])

  // 启动动画循环
  useEffect(() => {
    let ctx: CanvasRenderingContext2D | null = null
    let running = true

    const startAnimation = async () => {
      ctx = await getCtx()
      if (!ctx) return

      const animate = () => {
        if (!running || !ctx) return
        draw(ctx)
        animationRef.current = requestAnimationFrame(animate)
      }
      animate()
    }

    // 延迟启动，确保 Canvas 已挂载
    setTimeout(startAnimation, 100)

    return () => {
      running = false
      cancelAnimationFrame(animationRef.current)
    }
  }, [getCtx, draw])

  // action 变化时重置帧计数
  useEffect(() => {
    frameRef.current = 0
  }, [action])

  return (
    <Canvas
      type='2d'
      id={canvasId}
      canvasId={canvasId}
      style={{ width: '300px', height: '300px' }}
    />
  )
}
