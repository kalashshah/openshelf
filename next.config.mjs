import { fileURLToPath } from 'node:url';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // A package-lock.json in the home directory otherwise makes Next guess the wrong workspace root.
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
};

// `next dev` runs on Node, not workerd: this wires the Cloudflare bindings (DB, the rate limiter) into dev,
// so routes calling getCloudflareContext work locally.
initOpenNextCloudflareForDev();

export default nextConfig;
