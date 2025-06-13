import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/homepage/index.vue'),
  },
  {
    path: '/i',
    name: 'I',
    component: () => import('@/views/chapter-i/index.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
