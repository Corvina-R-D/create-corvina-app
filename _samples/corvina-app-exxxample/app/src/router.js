import * as VueRouter from 'vue-router'
import Home from './pages/Home.vue'
import List from './pages/List/List.vue'
import NotFound from './pages/NotFound.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/list', component: List },
  { path: '/:pathMatch(.*)*', component: NotFound },
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
  sensitive: true,
})

export default router