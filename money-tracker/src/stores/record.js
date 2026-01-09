import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useRecordStore = defineStore('record', () => {
  // 1. 定义数据：尝试从浏览器缓存读取，如果没有就是空数组
  const records = ref(JSON.parse(localStorage.getItem('my-money-data')) || [])

  // 2. 添加一笔账
  const addRecord = (form) => {
    records.value.unshift({
      id: Date.now(), // 用时间戳做唯一ID
      ...form
    })
  }

  // 3. 删除一笔账
  const removeRecord = (id) => {
    records.value = records.value.filter(item => item.id !== id)
  }

  // 4. 计算总收入和总支出
  const totalStats = computed(() => {
    let income = 0
    let expense = 0
    records.value.forEach(item => {
      if (item.type === '收入') income += Number(item.amount)
      else expense += Number(item.amount)
    })
    return { income, expense, balance: income - expense }
  })

  // 5. 监听数据变化，一旦变化自动保存到浏览器
  watch(records, (newVal) => {
    localStorage.setItem('my-money-data', JSON.stringify(newVal))
  }, { deep: true })

  return { records, addRecord, removeRecord, totalStats }
})