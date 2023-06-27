/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { NavTreeRMContextMenuService } from './NavTreeRMContextMenuService';
import { ResourceFoldersBootstrap } from './NavNodes/ResourceFoldersBootstrap';
import { NavResourceNodeService } from './NavResourceNodeService';

export const navigationTreeRMPlugin: PluginManifest = {
  info: { name: 'Navigation Tree RM plugin' },
  providers: [
    LocaleService,
    NavResourceNodeService,
    ResourceFoldersBootstrap,
    NavTreeRMContextMenuService
  ],
};
