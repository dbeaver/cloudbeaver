/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ModuleRegistry } from '../../ModuleRegistry.js';
import { TestBootstrap } from './TestBootstrap.js';
import { TestService } from './TestService.js';

export default ModuleRegistry.add({
  name: 'test-manifest',
  services: () => [TestService, TestBootstrap],
  bootstraps: () => [TestBootstrap],
});
