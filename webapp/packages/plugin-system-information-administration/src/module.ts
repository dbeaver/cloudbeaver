/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { SystemInformationBootstrap } from './SystemInformationBootstrap.js';
import { SystemInformationResource } from './SystemInformationResource.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-system-information-administration',

  services: () => [SystemInformationResource],
  bootstraps: () => [LocaleService, SystemInformationBootstrap],
});
