/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { corePluginManifest } from '@cloudbeaver/core-plugin';
import { coreProductManifest } from '@cloudbeaver/core-product';
import { coreRootManifest, ServerConfigResource } from '@cloudbeaver/core-root';
import { createGQLEndpoint } from '@cloudbeaver/core-root/dist/__custom_mocks__/createGQLEndpoint';
import { mockAppInit } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockGraphQL';
import { mockServerConfig } from '@cloudbeaver/core-root/dist/__custom_mocks__/resolvers/mockServerConfig';
import { coreSDKManifest } from '@cloudbeaver/core-sdk';
import { createApp } from '@cloudbeaver/tests-runner';

import { EventsSettings, EventsSettingsService } from './EventsSettingsService';
import { coreEventsManifest } from './manifest';

const endpoint = createGQLEndpoint();
const app = createApp(coreEventsManifest, corePluginManifest, coreProductManifest, coreRootManifest, coreSDKManifest);

const server = mockGraphQL(...mockAppInit(endpoint));

beforeAll(() => app.init());

const equalConfig = {
  core_events: {
    notificationsPool: 1,
    maxPersistentAllow: 2,
  } as EventsSettings,
  plugin: {
    notifications: {
      notificationsPool: 1,
      maxPersistentAllow: 2,
    } as EventsSettings,
  },
};

test('New settings equal deprecated settings', async () => {
  const settings = app.injector.getServiceByClass(EventsSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfig)));

  await config.refresh();

  expect(settings.settings.getValue('notificationsPool')).toBe(1);
  expect(settings.settings.getValue('maxPersistentAllow')).toBe(2);
  expect(settings.deprecatedSettings.getValue('notificationsPool')).toBe(1);
  expect(settings.deprecatedSettings.getValue('maxPersistentAllow')).toBe(2);
});
