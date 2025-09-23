/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { MenuSubMenuItem } from '@cloudbeaver/core-view';

import { MENU_PLUGIN } from './MENU_PLUGIN.js';
import type { IModule } from '@cloudbeaver/core-di';

export class PluginSubMenuItem extends MenuSubMenuItem {
  readonly module: IModule;

  constructor(module: IModule) {
    super({ menu: MENU_PLUGIN, label: module.name });

    this.module = module;

    Object.assign(this, {
      id: module.name,
    });
  }
}
