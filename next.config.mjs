import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Enhanced module resolution with absolute paths
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
      '@/components': resolve(__dirname, 'components'),
      '@/lib': resolve(__dirname, 'lib'),
      '@/app': resolve(__dirname, 'app'),
    }
    
    // Ensure proper file extension resolution
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json', '.mjs']
    
    // Add fallback for node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
    }

    // Exclude server-only packages from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        'pdf-parse': false,
      }
    }
    
    return config
  },
}

export default nextConfig