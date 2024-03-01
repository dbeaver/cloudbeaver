/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { coreBrowserManifest } from '@cloudbeaver/core-browser';
import { coreClientActivityManifest } from '@cloudbeaver/core-client-activity';
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

import { AdministrationSettings, AdministrationSettingsService } from './AdministrationSettingsService';
import { coreAdministrationManifest } from './manifest';

const endpoint = createGQLEndpoint();
const app = createApp(
  coreAdministrationManifest,
  coreEventsManifest,
  corePluginManifest,
  coreProductManifest,
  coreRootManifest,
  coreSDKManifest,
  coreSettingsManifest,
  coreBrowserManifest,
  // coreRoutingManifest,
  // coreThemingManifest,
  coreLocalizationManifest,
  coreClientActivityManifest,
);

const server = mockGraphQL(...mockAppInit(endpoint));

beforeAll(() => app.init());

const testValue = ['none'];

const equalConfig = {
  core: {
    administration: {
      baseFeatures: testValue,
    } as AdministrationSettings,
  },
};

test('Read settings', async () => {
  const settings = app.injector.getServiceByClass(AdministrationSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfig)));

  await config.refresh();

  expect(settings.settings.getValue('baseFeatures')).toEqual(testValue);
});
