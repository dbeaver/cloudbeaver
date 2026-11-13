/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { RouterService } from './RouterService.js';
import { ScreenService } from './Screen/ScreenService.js';
import { WindowsService } from './WindowsService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-routing',

  services: () => [RouterService, WindowsService, ScreenService],
  bootstraps: () => [RouterService],
});
