/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { coreBrowserManifest } from '@cloudbeaver/core-browser';
import { coreEventsManifest } from '@cloudbeaver/core-events';
import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
import { corePluginManifest } from '@cloudbeaver/core-plugin';
import { coreProductManifest } from '@cloudbeaver/core-product';
import { coreRootManifest, ServerConfigResource } from '@cloudbeaver/core-root';
import { createGQLEndpoint } from '@cloudbeaver/core-root/dist/__custom_mocks__/createGQLEndpoint';
import { mockAppInit } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockGraphQL';
import { mockServerConfig } from '@cloudbeaver/core-root/dist/__custom_mocks__/resolvers/mockServerConfig';
import { coreSDKManifest } from '@cloudbeaver/core-sdk';
import { coreSettingsManifest } from '@cloudbeaver/core-settings';
import { createApp } from '@cloudbeaver/tests-runner';

import { resourceManagerPlugin } from './manifest';
import { ResourceManagerSettings, ResourceManagerSettingsService } from './ResourceManagerSettingsService';

const endpoint = createGQLEndpoint();
const app = createApp(
  resourceManagerPlugin,
  coreEventsManifest,
  corePluginManifest,
  coreProductManifest,
  coreRootManifest,
  coreSDKManifest,
  coreSettingsManifest,
  coreBrowserManifest,
  coreLocalizationManifest,
);

const server = mockGraphQL(...mockAppInit(endpoint));

beforeAll(() => app.init());

const testValueA = true;
const testValueB = false;

const equalAConfig = {
  plugin_resource_manager: {
    disabled: testValueA,
  } as ResourceManagerSettings,
  plugin: {
    'resource-manager': {
      disabled: testValueA,
    } as ResourceManagerSettings,
  },
};

const equalBConfig = {
  plugin_resource_manager: {
    disabled: testValueB,
  } as ResourceManagerSettings,
  plugin: {
    'resource-manager': {
      disabled: testValueB,
    } as ResourceManagerSettings,
  },
};

test('New settings equal deprecated settings A', async () => {
  const settings = app.injector.getServiceByClass(ResourceManagerSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalAConfig)));

  await config.refresh();

  expect(settings.settings.getValue('disabled')).toBe(testValueA);
  expect(settings.deprecatedSettings.getValue('disabled')).toBe(testValueA);
});

test('New settings equal deprecated settings B', async () => {
  const settings = app.injector.getServiceByClass(ResourceManagerSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalBConfig)));

  await config.refresh();

  expect(settings.settings.getValue('disabled')).toBe(testValueB);
  expect(settings.deprecatedSettings.getValue('disabled')).toBe(testValueB);
});
