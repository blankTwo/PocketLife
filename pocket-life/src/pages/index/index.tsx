import { View, Text, Button } from '@tarojs/components'
import { useLoad, useDidShow } from '@tarojs/taro'
import { useCallback, useState } from 'react'
import { usePetStore } from '../../store'
import { getPet, doAction, reborn, initCloud } from '../../services'
import { getStateLevel, STATE_COLORS } from '../../utils'
import { PetCanvas } from '../../components'
import type { ActionType } from '../../types'
import './index.scss'

const COOLDOWN_TIME = 5000

export default function Index() {
  const { pet, loading, error, cooldown, setPet, setLoading, setError, setCooldown } = usePetStore()
  const [currentAction, setCurrentAction] = useState<'idle' | 'feed' | 'play' | 'sleep' | null>(null)

  // 加载宠物数据
  const loadPet = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPet()
      if (res.success && res.data) {
        setPet(res.data)
      } else {
        setError(res.error || '加载失败')
      }
    } catch (err) {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }, [setPet, setLoading, setError])

  // 执行行为
  const handleAction = useCallback(async (actionType: ActionType) => {
    if (cooldown || loading || !pet || pet.dead) return

    setCurrentAction(actionType)
    setCooldown(true)
    setLoading(true)
    try {
      const res = await doAction(actionType)
      if (res.success && res.data) {
        setPet(res.data)
      } else {
        setError(res.error || '操作失败')
      }
    } catch (err) {
      setError('网络错误')
    } finally {
      setLoading(false)
      setTimeout(() => {
        setCooldown(false)
        setCurrentAction(null)
      }, COOLDOWN_TIME)
    }
  }, [cooldown, loading, pet, setPet, setLoading, setError, setCooldown])

  // 重生
  const handleReborn = useCallback(async () => {
    setLoading(true)
    try {
      const res = await reborn()
      if (res.success && res.data) {
        setPet(res.data)
      } else {
        setError(res.error || '重生失败')
      }
    } catch (err) {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }, [setPet, setLoading, setError])

  useLoad(() => {
    initCloud()
    loadPet()
  })

  useDidShow(() => {
    if (pet) loadPet()
  })

  if (loading && !pet) {
    return (
      <View className='index'>
        <Text className='loading'>加载中...</Text>
      </View>
    )
  }

  if (error && !pet) {
    return (
      <View className='index'>
        <Text className='error'>{error}</Text>
        <Button onClick={loadPet}>重试</Button>
      </View>
    )
  }

  if (!pet) return null

  return (
    <View className='index'>
      {/* Canvas 宠物动画 */}
      <View className='pet-canvas-wrap'>
        <PetCanvas
          stage={pet.stage}
          mood={pet.mood}
          hunger={pet.hunger}
          energy={pet.energy}
          action={currentAction}
          dead={pet.dead}
        />
      </View>

      {/* 宠物信息 */}
      <View className='pet-info'>
        <Text className='pet-name'>{pet.name}</Text>
        <Text className='pet-stage'>阶段: {pet.stage}</Text>
      </View>

      {/* 状态数值 */}
      <View className='status-list'>
        <View className='status-item'>
          <Text className='status-label'>饥饿值</Text>
          <View className='status-bar'>
            <View
              className='status-fill'
              style={{
                width: `${pet.hunger}%`,
                backgroundColor: STATE_COLORS[getStateLevel(pet.hunger)]
              }}
            />
          </View>
          <Text className='status-value'>{pet.hunger}</Text>
        </View>

        <View className='status-item'>
          <Text className='status-label'>心情值</Text>
          <View className='status-bar'>
            <View
              className='status-fill'
              style={{
                width: `${pet.mood}%`,
                backgroundColor: STATE_COLORS[getStateLevel(pet.mood)]
              }}
            />
          </View>
          <Text className='status-value'>{pet.mood}</Text>
        </View>

        <View className='status-item'>
          <Text className='status-label'>精力值</Text>
          <View className='status-bar'>
            <View
              className='status-fill'
              style={{
                width: `${pet.energy}%`,
                backgroundColor: STATE_COLORS[getStateLevel(pet.energy)]
              }}
            />
          </View>
          <Text className='status-value'>{pet.energy}</Text>
        </View>
      </View>

      {/* 操作按钮 */}
      <View className='action-list'>
        <Button
          className='action-btn'
          disabled={cooldown || loading}
          onClick={() => handleAction('feed')}
        >
          喂食
        </Button>
        <Button
          className='action-btn'
          disabled={cooldown || loading}
          onClick={() => handleAction('play')}
        >
          玩耍
        </Button>
        <Button
          className='action-btn'
          disabled={cooldown || loading}
          onClick={() => handleAction('sleep')}
        >
          睡觉
        </Button>
      </View>

      {cooldown && <Text className='cooldown-tip'>冷却中...</Text>}
      {error && <Text className='error-tip'>{error}</Text>}
    </View>
  )
}
