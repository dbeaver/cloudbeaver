/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { App } from '../../App';
import { manifest } from './manifest';
import { TestBootstrap } from './TestBootstrap';
import { TestService } from './TestService';

test('App Initialization', async () => {
  const app = new App([manifest]);
  const injector = app.getServiceInjector();

  (app as any).registerServices();

  const service = injector.getServiceByClass(TestService);
  const bootstrap = injector.getServiceByClass(TestBootstrap);

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
