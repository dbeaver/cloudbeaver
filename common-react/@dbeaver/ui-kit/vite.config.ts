import tailwindcss from '@tailwindcss/vite';
import { assetResolverPlugin } from '@wroud/vite-plugin-asset-resolver';
import { tscPlugin } from '@wroud/vite-plugin-tsc';

/** @type {import('vite').UserConfig} */
export default {
  plugins: [
    tailwindcss(),
    assetResolverPlugin(),
    tscPlugin({
      tscArgs: ['-b'],
      enableOverlay: true,
      prebuild: true,
    }),
  ],
};
