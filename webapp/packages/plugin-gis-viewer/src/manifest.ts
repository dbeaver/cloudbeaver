import type { PluginManifest } from '@cloudbeaver/core-di';

import { GISViewerBootstrap } from './GISViewerBootstrap';
import { LocaleService } from './LocaleService';

export const manifest: PluginManifest = {
  info: {
    name: 'GIS Viewer plugin',
  },
  providers: [
    GISViewerBootstrap,
    LocaleService,
  ],
};
