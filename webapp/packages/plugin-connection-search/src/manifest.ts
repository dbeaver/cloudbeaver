import type { PluginManifest } from '@cloudbeaver/core-di';

import { ConnectionSearchSettingsService } from './ConnectionSearchSettingsService';
import { LocaleService } from './LocaleService';
import { ConnectionSearchService } from './Search/ConnectionSearchService';
import { SearchConnectionPluginBootstrap } from './SearchConnectionPluginBootstrap';

export const connectionSearchPlugin: PluginManifest = {
  info: {
    name: 'Search connection plugin',
  },
  providers: [SearchConnectionPluginBootstrap, ConnectionSearchService, LocaleService, ConnectionSearchSettingsService],
};
