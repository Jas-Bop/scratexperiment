import { mkdir, rename, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';

// npm run setup installs this toolchain once, in Anime Launch. All builds use that same version.
const require = createRequire(new URL('../anime-launch/package.json', import.meta.url));

export async function bundleJavaScript(options) {
  const { build } = require('esbuild');
  return build({ bundle: true, target: 'es2020', ...options });
}

/** A failed build must leave the previous playable output intact. */
export async function buildInStaging({ staging, output }, buildContents) {
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  try {
    await buildContents(staging);
    await rm(output, { recursive: true, force: true });
    await rename(staging, output);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}
