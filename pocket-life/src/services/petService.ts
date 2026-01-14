// 云函数调用服务
import Taro from '@tarojs/taro'
import type { Pet, ActionType, ApiResponse } from '../types'

// 初始化云开发
export function initCloud() {
  if (process.env.TARO_ENV === 'weapp') {
    Taro.cloud.init({ traceUser: true })
  }
}

// 获取/创建宠物
export async function getPet(): Promise<ApiResponse<Pet>> {
  const { result } = await Taro.cloud.callFunction({ name: 'getPet' })
  return result as ApiResponse<Pet>
}

// 执行行为
export async function doAction(actionType: ActionType): Promise<ApiResponse<Pet>> {
  const { result } = await Taro.cloud.callFunction({
    name: 'doAction',
    data: { actionType }
  })
  return result as ApiResponse<Pet>
}

// 重生
export async function reborn(): Promise<ApiResponse<Pet>> {
  const { result } = await Taro.cloud.callFunction({ name: 'reborn' })
  return result as ApiResponse<Pet>
}
