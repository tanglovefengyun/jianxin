// stores/timer.ts
import { defineStore } from 'pinia'

export const useTimerStore = defineStore('timer', {
  state: () => ({
    timerId: null as number | null,
  }),
  actions: {
    startTimer(callback: () => void, interval: number) {
      // 如果已有定时器，先清除
      this.clearTimer()
      this.timerId = window.setTimeout(callback, interval)
    },
    clearTimer() {
      if (this.timerId !== null) {
        clearTimeout(this.timerId)
        this.timerId = null
      }
    }
  }
})
