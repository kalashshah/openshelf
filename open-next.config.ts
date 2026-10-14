import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Every page reads live data (shops, products, sessions), so there is no ISR cache to configure.
export default defineCloudflareConfig({});
