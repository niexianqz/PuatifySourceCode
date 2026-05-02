import JavaScriptObfuscator from 'webpack-obfuscator';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {

    if (!dev && !isServer) {
      config.plugins.push(
        new JavaScriptObfuscator({
          rotateStringArray: true,
          stringArray: true,
          stringArrayThreshold: 0.75,
          debugProtection: true,
          debugProtectionInterval: 2000,
          disableConsoleOutput: true, 
          selfDefending: true, 
        }, [])
      );
    }
    return config;
  },
};

export default nextConfig;
