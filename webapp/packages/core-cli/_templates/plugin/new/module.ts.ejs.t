---
to: <%= name %>/src/module.ts
---
import { ModuleRegistry } from '@cloudbeaver/core-di';
import { <%= h.changeCase.pascal(name) %>Bootstrap } from './<%= h.changeCase.pascal(name) %>Bootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/<%= name %>',

  bootstraps: () => [<%= h.changeCase.pascal(name) %>Bootstrap],
});
