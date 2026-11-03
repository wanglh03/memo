import { handleApi } from './api.js'

/**
 * Worker 入口：
 * - /api/* 交给接口层
 * - 其余交给静态资源（Vite 构建产物），未命中的路径回退到 index.html
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url)
    }

    if (!env.ASSETS) {
      return new Response('静态资源绑定缺失', { status: 500 })
    }

    return env.ASSETS.fetch(request)
  },
}
