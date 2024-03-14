/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { coreClientActivityManifest } from '@cloudbeaver/core-client-activity';
import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
import { coreRootManifest, ServerConfigResource } from '@cloudbeaver/core-root';
import { createGQLEndpoint } from '@cloudbeaver/core-root/dist/__custom_mocks__/createGQLEndpoint';
import { mockAppInit } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockGraphQL';
import { mockServerConfig } from '@cloudbeaver/core-root/dist/__custom_mocks__/resolvers/mockServerConfig';
import { coreSDKManifest } from '@cloudbeaver/core-sdk';
import { coreSettingsManifest } from '@cloudbeaver/core-settings';
import { createApp } from '@cloudbeaver/tests-runner';

import { EventsSettings, EventsSettingsService } from './EventsSettingsService';
import { coreEventsManifest } from './manifest';

const endpoint = createGQLEndpoint();
const app = createApp(
  coreEventsManifest,
  coreSettingsManifest,
  coreLocalizationManifest,
  coreRootManifest,
  coreSDKManifest,
  coreClientActivityManifest,
);

const server = mockGraphQL(...mockAppInit(endpoint));

beforeAll(() => app.init());

const oldConfig = {
  core_events: {
    notificationsPool: 1,
    maxPersistentAllow: 2,
  } as EventsSettings,
};

const overrideConfig = {
  ...oldConfig,
  plugin: {
    notifications: {
      notificationsPool: 3,
      maxPersistentAllow: 4,
    } as EventsSettings,
  },
};

test('New settings override deprecated settings', async () => {
  const settings = app.injector.getServiceByClass(EventsSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(overrideConfig)));

  await config.refresh();

  expect(settings.settings.getValue('notificationsPool')).toBe(3);
  expect(settings.settings.getValue('maxPersistentAllow')).toBe(4);
});

test('Deprecated settings accessible with new settings', async () => {
  const settings = app.injector.getServiceByClass(EventsSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(oldConfig)));

  await config.refresh();

  expect(settings.settings.getValue('notificationsPool')).toBe(1);
  expect(settings.settings.getValue('maxPersistentAllow')).toBe(2);
});
