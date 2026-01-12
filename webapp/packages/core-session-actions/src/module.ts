/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';

import { CoreSessionActionsBootstrap } from './CoreSessionActionsBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { SessionActionsEventHandler } from './SessionActionsEventHandler.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-session-actions',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, CoreSessionActionsBootstrap)
      .addSingleton(SessionActionsEventHandler);
  },
});
