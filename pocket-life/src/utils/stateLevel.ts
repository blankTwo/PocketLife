// 状态等级判定
export type StateLevel = 'danger' | 'normal' | 'good'

// 根据数值获取状态等级
export function getStateLevel(value: number): StateLevel {
  if (value <= 30) return 'danger'
  if (value <= 60) return 'normal'
  return 'good'
}

// 状态等级对应颜色
export const STATE_COLORS: Record<StateLevel, string> = {
  danger: '#ff4d4f',
  normal: '#faad14',
  good: '#52c41a'
}
