/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { ServerConfigResource } from '@cloudbeaver/core-root';
import { createGQLEndpoint } from '@cloudbeaver/core-root/dist/__custom_mocks__/createGQLEndpoint';
import { mockAppInit } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockGraphQL';
import { mockServerConfig } from '@cloudbeaver/core-root/dist/__custom_mocks__/resolvers/mockServerConfig';
import { createApp } from '@cloudbeaver/tests-runner';

import { BrowserSettingsService, CookiesSettings, DeprecatedCookiesSettings } from './BrowserSettingsService';

const endpoint = createGQLEndpoint();
const app = createApp();

const server = mockGraphQL(...mockAppInit(endpoint));

beforeAll(() => app.init());

const testValueA = false;
const testValueB = true;

const equalConfigA = {
  core: {
    cookies: {
      disabled: testValueA,
    } as DeprecatedCookiesSettings,
    browser: {
      'cookies.disabled': testValueA,
    } as CookiesSettings,
  },
};

const equalConfigB = {
  core: {
    cookies: {
      disabled: testValueB,
    } as DeprecatedCookiesSettings,
    browser: {
      'cookies.disabled': testValueB,
    } as CookiesSettings,
  },
};

// TODO: fails because of circular dependency:
//       BrowserSettingsService -> ... -> LocalStorageSaveService -> core-browser/IndexedDB
test.skip('New settings equal deprecated settings A', async () => {
  const settings = app.injector.getServiceByClass(BrowserSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfigA)));

  await config.refresh();

  expect(settings.settings.getValue('cookies.disabled')).toBe(testValueA);
  expect(settings.deprecatedSettings.getValue('disabled')).toBe(testValueA);
});

test.skip('New settings equal deprecated settings B', async () => {
  const settings = app.injector.getServiceByClass(BrowserSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfigB)));

  await config.refresh();

  expect(settings.settings.getValue('cookies.disabled')).toBe(testValueB);
  expect(settings.deprecatedSettings.getValue('disabled')).toBe(testValueB);
});
