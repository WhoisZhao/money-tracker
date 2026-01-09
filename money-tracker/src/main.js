import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css' // 引入样式
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(ElementPlus) // 使用 Element Plus
app.mount('#app')