/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { expect, test } from 'vitest';

import { App } from '../../App.js';
import { manifest } from './manifest.js';
import { TestBootstrap } from './TestBootstrap.js';
import { TestService } from './TestService.js';

test('App Initialization', async () => {
  const app = new App([manifest]);

  await (app as any).registerServices();
  const serviceProvider = app.getServiceProvider();

  const service = serviceProvider.getService(TestService);
  const bootstrap = serviceProvider.getService(TestBootstrap);

  expect(service).toBeInstanceOf(TestService);
  expect(service.sum(1, 2)).toBe(3);

  expect(bootstrap.loaded).toBe(false);
  expect(bootstrap.sum).toBe(0);
  expect(bootstrap.registered).toBe(false);

  await (app as any).initializeServices();
  expect(bootstrap.loaded).toBe(false);
  expect(bootstrap.registered).toBe(true);

  await (app as any).loadServices();
  expect(bootstrap.loaded).toBe(true);
  expect(bootstrap.sum).toBe(3);
});
