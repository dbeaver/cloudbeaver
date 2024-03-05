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

import { coreThemingManifest } from './manifest';
import { IThemeSettings, ThemeSettingsService } from './ThemeSettingsService';

const endpoint = createGQLEndpoint();
const app = createApp(
  coreThemingManifest,
  coreEventsManifest,
  corePluginManifest,
  coreProductManifest,
  coreRootManifest,
  coreSDKManifest,
  coreSettingsManifest,
  coreBrowserManifest,
  coreLocalizationManifest,
  coreClientActivityManifest,
);

const server = mockGraphQL(...mockAppInit(endpoint));

beforeAll(() => app.init());

const testValueA = 'light';
const testValueB = 'dark';

const deprecatedSettings = {
  'core.user': {
    defaultTheme: testValueA,
  } as IThemeSettings,
};

const newSettings = {
  ...deprecatedSettings,
  core: {
    theming: {
      defaultTheme: testValueB,
    } as IThemeSettings,
  },
};

test('New Settings override deprecated settings', async () => {
  const settings = app.injector.getServiceByClass(ThemeSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(newSettings)));

  await config.refresh();

  expect(settings.settings.getValue('defaultTheme')).toBe(testValueB);
});

test('Deprecated settings are used if new settings are not defined', async () => {
  const settings = app.injector.getServiceByClass(ThemeSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(deprecatedSettings)));

  await config.refresh();

  expect(settings.settings.getValue('defaultTheme')).toBe(testValueA);
});
