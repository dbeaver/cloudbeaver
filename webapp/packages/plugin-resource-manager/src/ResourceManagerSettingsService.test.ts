/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
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

const testValueDeprecated = true;
const testValueNew = false;

const deprecatedSettings = {
  plugin_resource_manager: {
    disabled: testValueDeprecated,
  } as ResourceManagerSettings,
};

const newSettings = {
  ...deprecatedSettings,
  plugin: {
    'resource-manager': {
      disabled: testValueNew,
    } as ResourceManagerSettings,
  },
};

test('New settings equal deprecated settings A', async () => {
  const settings = app.injector.getServiceByClass(ResourceManagerSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(newSettings)));

  await config.refresh();

  expect(settings.settings.getValue('disabled')).toBe(testValueNew);
});

test('New settings equal deprecated settings B', async () => {
  const settings = app.injector.getServiceByClass(ResourceManagerSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(deprecatedSettings)));

  await config.refresh();

  expect(settings.settings.getValue('disabled')).toBe(testValueDeprecated);
});
