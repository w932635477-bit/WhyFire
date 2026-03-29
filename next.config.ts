import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  // 添加安全响应头以支持 SharedArrayBuffer (FFmpeg.wasm 多线程需要)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    // FFmpeg.wasm requires these configurations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }

      // 配置 webpack 正确处理 FFmpeg.wasm 的动态 import
      // 将 FFmpeg core 文件标记为 external，避免 webpack 尝试打包
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push({
          // 不处理 unpkg CDN 的 FFmpeg core
          '@ffmpeg/core': 'commonjs @ffmpeg/core',
          '@ffmpeg/core-mt': 'commonjs @ffmpeg/core-mt',
        })
      }

      // 禁用 webpack 对某些动态 import 的处理
      config.module = config.module || {}
      config.module.parser = config.module.parser || {}
      config.module.parser.javascript = {
        ...config.module.parser.javascript,
        // 允许动态 import 使用完整 URL
        dynamicImportMode: 'eager',
      }
    }
    return config
  },
}

export default nextConfig
