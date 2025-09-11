/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Enhanced module resolution for Vercel builds
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',
      '@/components': './components',
      '@/lib': './lib',
    }
    
    // Ensure proper file extension resolution
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json']
    
    return config
  },
}

export default nextConfig