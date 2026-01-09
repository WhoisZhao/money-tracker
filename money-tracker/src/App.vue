<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRecordStore } from './stores/record'
import * as echarts from 'echarts'
import { Download, Plus, Delete, Wallet } from '@element-plus/icons-vue' // 引入图标

const store = useRecordStore()
const dialogVisible = ref(false)
const chartRef = ref(null)
let myChart = null

// --- 升级功能1：预算设置 ---
const budget = ref(5000) // 假设每月预算5000
const budgetUsage = computed(() => {
  if (budget.value === 0) return 0
  const percent = (store.totalStats.expense / budget.value) * 100
  return percent > 100 ? 100 : parseFloat(percent.toFixed(1))
})
const progressColor = computed(() => {
  if (budgetUsage.value < 50) return '#67C23A' // 绿色（安全）
  if (budgetUsage.value < 80) return '#E6A23C' // 黄色（警告）
  return '#F56C6C' // 红色（危险）
})

// 表单数据
const form = ref({
  type: '支出',
  category: '餐饮',
  amount: '',
  date: new Date().toISOString().split('T')[0]
})
const categories = ['餐饮', '交通', '购物', '工资', '娱乐', '房租', '医疗', '理财']

// --- 升级功能2：导出数据 ---
const exportData = () => {
  // 定义表头
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
  csvContent += "日期,类型,分类,金额\n";
  
  // 遍历数据拼接字符串
  store.records.forEach(item => {
    const row = `${item.date},${item.type},${item.category},${item.amount}`;
    csvContent += row + "\r\n";
  });

  // 创建下载链接并点击
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "我的记账本数据.csv");
  document.body.appendChild(link);
  link.click();
}

const onSubmit = () => {
  if (!form.value.amount) return alert('请填写金额')
  store.addRecord({ ...form.value })
  dialogVisible.value = false
  form.value.amount = ''
  updateChart()
}

const handleDelete = (id) => {
  if(confirm('确定删除这条记录吗？')) {
    store.removeRecord(id)
    updateChart()
  }
}

// 图表更新逻辑
const updateChart = () => {
  const dataMap = {}
  // 仅统计支出数据
  store.records.forEach(item => {
    if (item.type === '支出') {
      dataMap[item.category] = (dataMap[item.category] || 0) + Number(item.amount)
    }
  })
  const chartData = Object.keys(dataMap).map(key => ({ value: dataMap[key], name: key }))

  const option = {
    title: { text: '本月支出构成', left: 'left', textStyle: { fontSize: 16 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'], // 变成环形图，更好看
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: chartData.length ? chartData : [{value:0, name:'无支出'}]
    }]
  }
  
  nextTick(() => {
    if (!myChart) myChart = echarts.init(chartRef.value)
    myChart.setOption(option)
  })
}

onMounted(() => {
  updateChart()
})
</script>

<template>
  <div class="app-bg">
    <div class="container">
      <div class="nav-header">
        <h2><el-icon style="vertical-align: middle"><Wallet /></el-icon> 个人智能记账本</h2>
        <el-button type="success" :icon="Download" @click="exportData" plain>导出Excel</el-button>
      </div>

      <el-row :gutter="20" class="mb-4">
        <el-col :span="8">
          <el-card shadow="hover" class="data-card income-card">
            <template #header>总收入</template>
            <div class="card-num">+{{ store.totalStats.income }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="data-card expense-card">
            <template #header>总支出</template>
            <div class="card-num">-{{ store.totalStats.expense }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="data-card balance-card">
            <template #header>结余</template>
            <div class="card-num">{{ store.totalStats.balance }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="14">
           <el-card shadow="hover" class="chart-box">
             <div v-if="store.records.length === 0" class="empty-box">
                <el-empty description="暂无数据，快去记一笔吧" />
             </div>
             <div v-else ref="chartRef" style="width: 100%; height: 300px;"></div>
           </el-card>
        </el-col>
        <el-col :span="10">
          <el-card shadow="hover" class="budget-box">
            <h3>本月预算进度</h3>
            <div class="budget-info">
              <span>已用: {{ store.totalStats.expense }}</span>
              <span>预算: {{ budget }}</span>
            </div>
            <el-progress 
              :text-inside="true" 
              :stroke-width="24" 
              :percentage="budgetUsage" 
              :status="budgetUsage > 100 ? 'exception' : ''"
              :color="progressColor"
            />
            <el-divider />
            <el-button type="primary" size="large" :icon="Plus" class="add-btn" @click="dialogVisible = true">
              立即记账
            </el-button>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="hover" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>收支明细</span>
          </div>
        </template>
        <el-table :data="store.records" stripe style="width: 100%" max-height="400">
          <el-table-column prop="date" label="日期" width="120" sortable />
          <el-table-column prop="type" label="类型" width="80">
            <template #default="scope">
              <el-tag :type="scope.row.type === '收入' ? 'success' : 'danger'">{{ scope.row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="100" />
          <el-table-column prop="amount" label="金额" sortable>
            <template #default="scope">
              <span style="font-weight: bold;">￥{{ scope.row.amount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="right">
            <template #default="scope">
              <el-button type="danger" :icon="Delete" circle size="small" @click="handleDelete(scope.row.id)" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-dialog v-model="dialogVisible" title="📝 记一笔" width="500px">
        <el-form :model="form" label-width="60px">
          <el-form-item label="类型">
            <el-radio-group v-model="form.type">
              <el-radio value="支出" label="支出">支出</el-radio>
              <el-radio value="收入" label="收入">收入</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="分类">
            <el-select v-model="form.category" placeholder="选择分类" style="width: 100%">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="金额">
            <el-input v-model="form.amount" type="number" placeholder="0.00">
              <template #prefix>￥</template>
            </el-input>
          </el-form-item>
          <el-form-item label="日期">
            <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width: 100%"/>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="onSubmit">确认保存</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<style scoped>
.app-bg {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding: 20px;
}
.container {
  max-width: 900px; /* 变宽一点，更大气 */
  margin: 0 auto;
}
.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.data-card {
  text-align: center;
  border-radius: 8px;
}
.card-num {
  font-size: 24px;
  font-weight: bold;
  margin: 10px 0;
}
.income-card .card-num { color: #67C23A; }
.expense-card .card-num { color: #F56C6C; }
.balance-card .card-num { color: #409EFF; }

.mb-4 { margin-bottom: 20px; }
.add-btn { width: 100%; margin-top: 20px; font-weight: bold; }
.budget-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  color: #666;
  font-size: 14px;
}
.empty-box {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}
</style>