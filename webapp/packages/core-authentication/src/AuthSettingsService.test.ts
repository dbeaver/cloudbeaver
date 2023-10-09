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
import { coreRoutingManifest } from '@cloudbeaver/core-routing';
import { coreSDKManifest } from '@cloudbeaver/core-sdk';
import { coreSettingsManifest } from '@cloudbeaver/core-settings';
import { coreThemingManifest } from '@cloudbeaver/core-theming';
import { createApp } from '@cloudbeaver/tests-runner';

import { mockAuthentication } from './__custom_mocks__/mockAuthentication';
import { AuthSettings, AuthSettingsService } from './AuthSettingsService';
import { coreAuthenticationManifest } from './manifest';

const endpoint = createGQLEndpoint();
const app = createApp(
  coreAuthenticationManifest,
  coreEventsManifest,
  corePluginManifest,
  coreProductManifest,
  coreRootManifest,
  coreSDKManifest,
  coreSettingsManifest,
  coreBrowserManifest,
  coreRoutingManifest,
  coreThemingManifest,
  coreLocalizationManifest,
);

const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));

beforeAll(() => app.init());

const equalConfig = {
  core: {
    authentication: {
      baseAuthProvider: 'sd',
      primaryAuthProvider: 'sd',
      disableAnonymousAccess: true,
    } as AuthSettings,
  },
};

test('Read settings', async () => {
  const settings = app.injector.getServiceByClass(AuthSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfig)));

  await config.refresh();

  expect(settings.settings.getValue('baseAuthProvider')).toBe('sd');
  expect(settings.settings.getValue('primaryAuthProvider')).toBe('sd');
  expect(settings.settings.getValue('disableAnonymousAccess')).toBe(true);
});
