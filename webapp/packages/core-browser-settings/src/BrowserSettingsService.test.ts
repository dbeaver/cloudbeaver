/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { coreBrowserManifest } from '@cloudbeaver/core-browser';
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

import { BrowserSettingsService, CookiesSettings } from './BrowserSettingsService';
import { coreBrowserSettingsManifest } from './manifest';

const endpoint = createGQLEndpoint();
const app = createApp(
  coreBrowserManifest,
  coreBrowserSettingsManifest,
  corePluginManifest,
  coreProductManifest,
  coreRootManifest,
  coreSDKManifest,
  coreSettingsManifest,
  coreLocalizationManifest,
);

const server = mockGraphQL(...mockAppInit(endpoint));

beforeAll(() => app.init());

const testValueA = false;
const testValueB = true;

const equalConfigA = {
  core: {
    cookies: {
      disabled: testValueA,
    },
    browser: {
      'cookies.disabled': testValueA,
    } as CookiesSettings,
  },
};

const equalConfigB = {
  core: {
    cookies: {
      disabled: testValueB,
    },
  },
};

test('New settings override deprecated settings', async () => {
  const settings = app.injector.getServiceByClass(BrowserSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfigA)));

  await config.refresh();

  expect(settings.settings.getValue('cookies.disabled')).toBe(testValueA);
});

test('New settings fall back to deprecated settings', async () => {
  const settings = app.injector.getServiceByClass(BrowserSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfigB)));

  await config.refresh();

  expect(settings.settings.getValue('cookies.disabled')).toBe(testValueB);
});
