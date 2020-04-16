/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IServiceInjector, PluginManifest } from '@dbeaver/core/di';

import { ObjectFoldersService } from './ObjectFoldersService';
import { ObjectFoldersTabService } from './ObjectFoldersTab/ObjectFoldersTabService';
import { ObjectInfoTabService } from './ObjectInfoTab/ObjectInfoTabService';
import { ObjectViewerBootstrap } from './ObjectViewerBootstrap';
import { ObjectViewerService } from './ObjectViewerService';
import { ObjectViewerTabService } from './ObjectViewerTabService';
import { VirtualFolderTabService } from './VirtualFolderTab/VirtualFolderTabService';

export const manifest: PluginManifest = {
  info: { name: 'Object Viewer Plugin' },

  providers: [
    ObjectViewerService,
    ObjectFoldersService,
    ObjectViewerTabService,
    ObjectInfoTabService,
    ObjectFoldersTabService,
    VirtualFolderTabService,
  ],

  async initialize(injector: IServiceInjector) {
    injector
      .resolveServiceByClass(ObjectViewerBootstrap)
      .bootstrap();
  },

};
