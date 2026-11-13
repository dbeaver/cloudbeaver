/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { DBObjectPageService } from './ObjectPage/DBObjectPageService.js';
import { NavNodeMetadataViewBootstrap } from './ObjectPropertiesPage/NavNodeView/NavNodeMetadata/NavNodeMetadataViewBootstrap.js';
import { VirtualFolderViewBootstrap } from './ObjectPropertiesPage/NavNodeView/VirtualFolder/VirtualFolderViewBootstrap.js';
import { ObjectPropertiesPageService } from './ObjectPropertiesPage/ObjectPropertiesPageService.js';
import { ObjectPropertyTableFooterService } from './ObjectPropertiesPage/ObjectPropertyTable/ObjectPropertyTableFooterService.js';
import { ObjectViewerBootstrap } from './ObjectViewerBootstrap.js';
import { ObjectViewerTabService } from './ObjectViewerTabService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-object-viewer',

  services: () => [ObjectViewerTabService, ObjectPropertyTableFooterService, ObjectPropertiesPageService, DBObjectPageService],
  bootstraps: () => [LocaleService, ObjectViewerBootstrap, VirtualFolderViewBootstrap, NavNodeMetadataViewBootstrap],
});
