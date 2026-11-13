/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { ActionService } from './Action/ActionService.js';
import { KeyBindingService } from './Action/KeyBinding/KeyBindingService.js';
import { LocaleService } from './LocaleService.js';
import { MenuService } from './Menu/MenuService.js';
import { ViewService } from './View/ViewService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-view',

  services: () => [ActionService, ViewService, MenuService, KeyBindingService],
  bootstraps: () => [LocaleService],
});
