/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
          {
            source: '/api/:path*', // Áp dụng cho tất cả các đường dẫn
            headers: [
              {
                key: 'Access-Control-Allow-Origin',
                value: '*', // Hoặc chỉ định miền cụ thể
              },
              {
                key: 'Access-Control-Allow-Methods',
                value: 'GET,HEAD,PUT,PATCH,POST,DELETE',
              },
              {
                key: 'Access-Control-Allow-Headers',
                value: 'Authorization, Content-Type',
              },
            ],
          },
        ];
      },
};

export default nextConfig;
