/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { ActionService } from './Action/ActionService';
import { KeyBindingService } from './Action/KeyBinding/KeyBindingService';
import { LocaleService } from './LocaleService';
import { MenuService } from './Menu/MenuService';
import { ViewService } from './View/ViewService';

export const manifest: PluginManifest = {
  info: {
    name: 'Core View',
  },

  providers: [
    ActionService,
    KeyBindingService,
    MenuService,
    ViewService,
    LocaleService,
  ],
};
