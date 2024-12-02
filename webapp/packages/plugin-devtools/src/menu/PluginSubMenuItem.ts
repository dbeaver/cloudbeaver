/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';
import { MenuSubMenuItem } from '@cloudbeaver/core-view';

import { MENU_PLUGIN } from './MENU_PLUGIN.js';

export class PluginSubMenuItem extends MenuSubMenuItem {
  readonly plugin: PluginManifest;

  constructor(plugin: PluginManifest) {
    super({ menu: MENU_PLUGIN, label: plugin.info.name });

    this.plugin = plugin;

    Object.assign(this, {
      id: plugin.info.name,
    });
  }
}
