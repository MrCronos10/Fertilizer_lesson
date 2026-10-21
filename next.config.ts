import type { NextConfig } from "next";
import { DEFAULT_LOCALE } from "./lib/locales";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    // Temporary, not permanent: the default locale may change when Khmer ships.
    return [{ source: "/", destination: `/${DEFAULT_LOCALE}`, permanent: false }];
  },
};

export default nextConfig;
