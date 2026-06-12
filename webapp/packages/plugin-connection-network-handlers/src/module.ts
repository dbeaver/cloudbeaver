import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { PluginConnectionNetworkHandlersBootstrap } from './PluginConnectionNetworkHandlersBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-network-handlers',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, PluginConnectionNetworkHandlersBootstrap);
  },
});