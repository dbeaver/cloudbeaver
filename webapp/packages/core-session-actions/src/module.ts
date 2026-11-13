/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ModuleRegistry } from '@cloudbeaver/core-di';

import { CoreSessionActionsBootstrap } from './CoreSessionActionsBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { SessionActionsEventHandler } from './SessionActionsEventHandler.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-session-actions',

  services: () => [SessionActionsEventHandler],
  bootstraps: () => [LocaleService, CoreSessionActionsBootstrap],
});
