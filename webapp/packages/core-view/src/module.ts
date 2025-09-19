/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';
import { ViewService } from './View/ViewService.js';
import { MenuService } from './Menu/MenuService.js';
import { LocaleService } from './LocaleService.js';
import { KeyBindingService } from './Action/KeyBinding/KeyBindingService.js';
import { ActionService } from './Action/ActionService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-view',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(ActionService)
      .addSingleton(ViewService)
      .addSingleton(MenuService)
      .addSingleton(KeyBindingService);
  },
});
