/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { ChristmasService } from './Christmas/ChristmasService.js';
import { HolidaysService } from './HolidaysService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-holidays',

  services: () => [ChristmasService, HolidaysService],
  bootstraps: () => [ChristmasService, HolidaysService],
});
