/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';
import { ObjectViewerTabService } from './ObjectViewerTabService.js';
import { ObjectViewerBootstrap } from './ObjectViewerBootstrap.js';
import { ObjectPropertyTableFooterService } from './ObjectPropertiesPage/ObjectPropertyTable/ObjectPropertyTableFooterService.js';
import { ObjectPropertiesPageService } from './ObjectPropertiesPage/ObjectPropertiesPageService.js';
import { VirtualFolderViewBootstrap } from './ObjectPropertiesPage/NavNodeView/VirtualFolder/VirtualFolderViewBootstrap.js';
import { NavNodeMetadataViewBootstrap } from './ObjectPropertiesPage/NavNodeView/NavNodeMetadata/NavNodeMetadataViewBootstrap.js';
import { DBObjectPageService } from './ObjectPage/DBObjectPageService.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-object-viewer',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, ObjectViewerBootstrap)
      .addSingleton(Bootstrap, VirtualFolderViewBootstrap)
      .addSingleton(Bootstrap, NavNodeMetadataViewBootstrap)
      .addSingleton(ObjectViewerTabService)
      .addSingleton(ObjectPropertyTableFooterService)
      .addSingleton(ObjectPropertiesPageService)
      .addSingleton(DBObjectPageService);
  },
});
