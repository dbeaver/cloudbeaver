/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { ConnectionSSHTabService } from './SSH/ConnectionSSHTabService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-network-handlers',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(ConnectionSSHTabService))
      .addSingleton(ConnectionSSHTabService);
  },
});
