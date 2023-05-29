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
import datasourceContextSwitch from '@cloudbeaver/plugin-datasource-context-switch';
import navigationTabs from '@cloudbeaver/plugin-navigation-tabs';
import navigationTree from '@cloudbeaver/plugin-navigation-tree';
import objectViewer from '@cloudbeaver/plugin-object-viewer';

import { DataViewerSettings, DataViewerSettingsService } from './DataViewerSettingsService';
import { manifest } from './manifest';

const endpoint = createGQLEndpoint();
const app = createApp(datasourceContextSwitch, navigationTree, navigationTabs, objectViewer, manifest);

const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));

beforeAll(() => app.init());

const testValueA = true;
const testValueB = false;

const equalConfigA = {
  'core.app.dataViewer': {
    disableEdit: testValueA,
  } as DataViewerSettings,
  plugin: {
    'data-viewer': {
      disableEdit: testValueA,
    } as DataViewerSettings,
  },
};

const equalConfigB = {
  'core.app.dataViewer': {
    disableEdit: testValueB,
  } as DataViewerSettings,
  plugin: {
    'data-viewer': {
      disableEdit: testValueB,
    } as DataViewerSettings,
  },
};

async function setupSettingsService(mockConfig: any = {}) {
  const settings = app.injector.getServiceByClass(DataViewerSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(mockConfig)));

  await config.refresh();

  return settings;
}

test('New settings equal deprecated settings A', async () => {
  const settingsService = await setupSettingsService(equalConfigA);

  expect(settingsService.settings.getValue('disableEdit')).toBe(testValueA);
  expect(settingsService.deprecatedSettings.getValue('disableEdit')).toBe(testValueA);
});

test('New settings equal deprecated settings B', async () => {
  const settingsService = await setupSettingsService(equalConfigB);

  expect(settingsService.settings.getValue('disableEdit')).toBe(testValueB);
  expect(settingsService.deprecatedSettings.getValue('disableEdit')).toBe(testValueB);
});

describe('DataViewerSettingsService.getDefaultRowsCount', () => {
  let settingsService: DataViewerSettingsService = null as any;

  beforeAll(async () => {
    settingsService = await setupSettingsService({
      plugin: {
        'data-viewer': {
          fetchMin: 200,
          fetchMax: 1000,
          fetchDefault: 300,
        },
      },
    });
  });

  test('should return valid value', () => {
    expect(settingsService.getDefaultRowsCount(400)).toBe(400);
  });

  test('should return valid default value', () => {
    expect(settingsService.getDefaultRowsCount()).toBe(300);
  });

  test('should return valid minimal value', () => {
    expect(settingsService.getDefaultRowsCount(10)).toBe(200);
  });

  test('should return valid maximal value', () => {
    expect(settingsService.getDefaultRowsCount(1100)).toBe(1000);
  });
});
