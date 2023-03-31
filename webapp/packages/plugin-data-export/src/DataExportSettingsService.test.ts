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
import dataViewer from '@cloudbeaver/plugin-data-viewer';
import datasourceContextSwitch from '@cloudbeaver/plugin-datasource-context-switch';
import navigationTabs from '@cloudbeaver/plugin-navigation-tabs';
import navigationTree from '@cloudbeaver/plugin-navigation-tree';
import objectViewer from '@cloudbeaver/plugin-object-viewer';

import { DataExportSettings, DataExportSettingsService } from './DataExportSettingsService';
import { manifest } from './manifest';

const endpoint = createGQLEndpoint();
const app = createApp(
  datasourceContextSwitch,
  navigationTree,
  navigationTabs,
  objectViewer,
  dataViewer,
  manifest
);

const server = mockGraphQL(
  ...mockAppInit(endpoint),
  ...mockAuthentication(endpoint)
);

beforeAll(() => app.init());

const testValueA = true;
const testValueB = true;

const equalConfigA = {
  plugin_data_export: {
    disabled: testValueA,
  } as DataExportSettings,
  plugin: {
    'data-export': {
      disabled: testValueA,
    } as DataExportSettings,
  },
};

const equalConfigB = {
  plugin_data_export: {
    disabled: testValueB,
  } as DataExportSettings,
  plugin: {
    'data-export': {
      disabled: testValueB,
    } as DataExportSettings,
  },
};

test('New settings equal deprecated settings A', async () => {
  const settings = app.injector.getServiceByClass(DataExportSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(
    endpoint.query('serverConfig', mockServerConfig(equalConfigA)),
  );

  await config.refresh();

  expect(settings.settings.getValue('disabled')).toBe(testValueA);
  expect(settings.deprecatedSettings.getValue('disabled')).toBe(testValueA);
});

test('New settings equal deprecated settings B', async () => {
  const settings = app.injector.getServiceByClass(DataExportSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(
    endpoint.query('serverConfig', mockServerConfig(equalConfigB)),
  );

  await config.refresh();

  expect(settings.settings.getValue('disabled')).toBe(testValueB);
  expect(settings.deprecatedSettings.getValue('disabled')).toBe(testValueB);
});