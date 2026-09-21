import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is for the Docker image. Local Windows builds cannot
  // always create the required symlinks.
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
};

export default nextConfig;
