/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { mockAuthentication } from '@cloudbeaver/core-authentication/mocks/mockAuthentication';
import { createApp } from '@cloudbeaver/core-cli/tests/utils/createApp';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { createGQLEndpoint } from '@cloudbeaver/core-root/mocks/createGQLEndpoint';
import { mockAppInit } from '@cloudbeaver/core-root/mocks/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/mocks/mockGraphQL';
import { mockServerConfig } from '@cloudbeaver/core-root/mocks/resolvers/mockServerConfig';

import { IThemeSettings, ThemeSettingsService } from './ThemeSettingsService';

const endpoint = createGQLEndpoint();
const app = createApp();

const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));

beforeAll(() => app.init());

const testValueA = 'light';
const testValueB = 'dark';

const equalConfigA = {
  'core.user': {
    defaultTheme: testValueA,
  } as IThemeSettings,
  core: {
    theming: {
      defaultTheme: testValueA,
    } as IThemeSettings,
  },
};

const equalConfigB = {
  'core.user': {
    defaultTheme: testValueB,
  } as IThemeSettings,
  core: {
    theming: {
      defaultTheme: testValueB,
    } as IThemeSettings,
  },
};

test('New settings equal deprecated settings "light"', async () => {
  const settings = app.injector.getServiceByClass(ThemeSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfigA)));

  await config.refresh();

  expect(settings.settings.getValue('defaultTheme')).toBe(testValueA);
  expect(settings.deprecatedSettings.getValue('defaultTheme')).toBe(testValueA);
});

test('New settings equal deprecated settings "dark"', async () => {
  const settings = app.injector.getServiceByClass(ThemeSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfigB)));

  await config.refresh();

  expect(settings.settings.getValue('defaultTheme')).toBe(testValueB);
  expect(settings.deprecatedSettings.getValue('defaultTheme')).toBe(testValueB);
});
