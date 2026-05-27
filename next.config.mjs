/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'google.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*',
        pathname: '**'
      }
    ],
  },
  allowedDevOrigins: ['*.ngrok.free.app'],
};

export default nextConfig;
