/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { DBObjectPageService } from './ObjectPage/DBObjectPageService';
import { NavNodeMetadataViewBootstrap } from './ObjectPropertiesPage/NavNodeView/NavNodeMetadata/NavNodeMetadataViewBootstrap';
import { VirtualFolderViewBootstrap } from './ObjectPropertiesPage/NavNodeView/VirtualFolder/VirtualFolderViewBootstrap';
import { ObjectPropertiesPageService } from './ObjectPropertiesPage/ObjectPropertiesPageService';
import { ObjectPropertyTableFooterService } from './ObjectPropertiesPage/ObjectPropertyTable/ObjectPropertyTableFooterService';
import { ObjectViewerBootstrap } from './ObjectViewerBootstrap';
import { ObjectViewerTabService } from './ObjectViewerTabService';

export const manifest: PluginManifest = {
  info: { name: 'Object Viewer Plugin' },

  providers: [
    ObjectViewerBootstrap,
    NavNodeMetadataViewBootstrap,
    VirtualFolderViewBootstrap,
    ObjectPropertiesPageService,
    ObjectViewerTabService,
    DBObjectPageService,
    LocaleService,
    ObjectPropertyTableFooterService,
  ],
};
