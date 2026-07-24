/** @type {import('next').NextConfig} */
const nextConfig = {
  // firebase-admin의 내부 의존성(jwks-rsa -> jose)이 ESM 전용이라, Next가 번들링하면
  // 서버리스 런타임에서 ERR_REQUIRE_ESM으로 터진다. 번들링하지 않고 node_modules에서
  // 그대로 require/resolve하도록 외부 패키지로 지정해서 우회한다.
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
};

export default nextConfig;
