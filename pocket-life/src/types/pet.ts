// 宠物进化阶段
export type PetStage = 'baby' | 'adult' | 'master'

// 行为类型
export type ActionType = 'feed' | 'play' | 'sleep'

// 宠物实体
export interface Pet {
  _id: string
  openid: string
  name: string
  stage: PetStage
  hunger: number
  mood: number
  energy: number
  lastUpdate: number
  lastActionAt: number
  createdAt: number
  goodStateStartAt: number | null
  dead: boolean
  deadAt: number | null
  version: number
}
