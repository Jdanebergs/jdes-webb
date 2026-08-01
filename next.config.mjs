/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/se/statistik-lastbilsladdare',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
