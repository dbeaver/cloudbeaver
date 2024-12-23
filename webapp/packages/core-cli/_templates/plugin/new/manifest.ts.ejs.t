---
to: <%= name %>/src/manifest.ts
---
import type { PluginManifest } from '@cloudbeaver/core-di';

export const <%= h.changeCase.camel(name) %>Manifest: PluginManifest = {
  info: {
    name: '<%= h.changeCase.sentence(name) %>',
  },

  providers: [() => import('./<%= h.changeCase.pascal(name) %>ServiceBootstrap.js').then(m => m.<%= h.changeCase.pascal(name) %>ServiceBootstrap)],
};