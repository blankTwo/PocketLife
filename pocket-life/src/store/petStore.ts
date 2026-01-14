// 宠物状态管理
import { create } from 'zustand'
import type { Pet, ActionType } from '../types'

interface PetState {
  pet: Pet | null
  loading: boolean
  error: string | null
  cooldown: boolean
}

interface PetActions {
  setPet: (pet: Pet | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setCooldown: (cooldown: boolean) => void
  reset: () => void
}

const initialState: PetState = {
  pet: null,
  loading: false,
  error: null,
  cooldown: false
}

export const usePetStore = create<PetState & PetActions>((set) => ({
  ...initialState,
  setPet: (pet) => set({ pet }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCooldown: (cooldown) => set({ cooldown }),
  reset: () => set(initialState)
}))
