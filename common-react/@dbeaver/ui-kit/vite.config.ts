import tailwindcss from '@tailwindcss/vite';
import { assetResolverPlugin } from '@wroud/vite-plugin-asset-resolver';

/** @type {import('vite').UserConfig} */
export default {
  plugins: [tailwindcss(), assetResolverPlugin()],
}