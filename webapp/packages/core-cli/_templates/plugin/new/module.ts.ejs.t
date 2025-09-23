---
to: <%= name %>/src/module.ts
---
import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';
import { <%= h.changeCase.pascal(name) %>Bootstrap } from './<%= h.changeCase.pascal(name) %>Bootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/<%= name %>',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, <%= h.changeCase.pascal(name) %>Bootstrap);
  },
});