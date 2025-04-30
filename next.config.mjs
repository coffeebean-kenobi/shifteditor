/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracing: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'onnxruntime-node'],
  },
};

export default nextConfig; 