/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ModuleRegistry, proxy } from '@wroud/di';
import { TestService } from './TestService.js';
import { TestBootstrap } from './TestBootstrap.js';
import { Bootstrap } from '../../Bootstrap.js';

export default ModuleRegistry.add({
  name: 'test-manifest',
  configure(serviceCollection) {
    serviceCollection.addSingleton(TestService).addSingleton(Bootstrap, proxy(TestBootstrap)).addSingleton(TestBootstrap);
  },
});
