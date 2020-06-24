/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IServiceInjector, PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { DBObjectPageService } from './ObjectPage/DBObjectPageService';
import { ObjectFoldersService } from './ObjectPropertiesPage/ObjectFoldersService';
import { ObjectFoldersTabService } from './ObjectPropertiesPage/ObjectFoldersTab/ObjectFoldersTabService';
import { ObjectInfoTabService } from './ObjectPropertiesPage/ObjectInfoTab/ObjectInfoTabService';
import { ObjectPropertiesPageService } from './ObjectPropertiesPage/ObjectPropertiesPageService';
import { VirtualFolderTabService } from './ObjectPropertiesPage/VirtualFolderTab/VirtualFolderTabService';
import { ObjectViewerBootstrap } from './ObjectViewerBootstrap';
import { ObjectViewerTabService } from './ObjectViewerTabService';

export const manifest: PluginManifest = {
  info: { name: 'Object Viewer Plugin' },

  providers: [
    ObjectPropertiesPageService,
    ObjectFoldersService,
    ObjectViewerTabService,
    ObjectInfoTabService,
    ObjectFoldersTabService,
    VirtualFolderTabService,
    DBObjectPageService,
    LocaleService,
  ],

  async initialize(injector: IServiceInjector) {
    injector
      .resolveServiceByClass(ObjectViewerBootstrap)
      .bootstrap();
  },

};
