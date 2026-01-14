// 云函数响应基础类型
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  isNew?: boolean
}
