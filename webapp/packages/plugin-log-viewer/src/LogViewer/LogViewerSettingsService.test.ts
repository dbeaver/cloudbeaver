/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import '@testing-library/jest-dom';

import { CoreSettingsService } from '@cloudbeaver/core-app';
import { mockAuthentication } from '@cloudbeaver/core-authentication/mocks/mockAuthentication';
import { createApp } from '@cloudbeaver/core-cli/tests/utils/createApp';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { createGQLEndpoint } from '@cloudbeaver/core-root/mocks/createGQLEndpoint';
import { mockAppInit } from '@cloudbeaver/core-root/mocks/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/mocks/mockGraphQL';
import { mockServerConfig } from '@cloudbeaver/core-root/mocks/resolvers/mockServerConfig';
import administrationPlugin from '@cloudbeaver/plugin-administration';
import toolsPanel from '@cloudbeaver/plugin-tools-panel';
import topAppBarPlugin from '@cloudbeaver/plugin-top-app-bar';

import { logViewerPlugin } from '../manifest';
import { LogViewerSettings, LogViewerSettingsService } from './LogViewerSettingsService';

const endpoint = createGQLEndpoint();
const app = createApp(
  administrationPlugin,
  topAppBarPlugin,
  toolsPanel,
  logViewerPlugin
);

const server = mockGraphQL(
  ...mockAppInit(endpoint),
  ...mockAuthentication(endpoint)
);

beforeAll(() => app.init());

const equalConfig = {
  core: {
    app:{
      logViewer: {
        refreshTimeout: 1,
        maxLogRecords: 2,
        logBatchSize: 3,
        maxFailedRequests: 4,
      } as LogViewerSettings,
    },
  },
  plugin: {
    'log-viewer': {
      refreshTimeout: 1,
      maxLogRecords: 2,
      logBatchSize: 3,
      maxFailedRequests: 4,
    } as LogViewerSettings,
  },
};

test('New settings equal deprecated settings', async () => {
  const settings = app.injector.getServiceByClass(LogViewerSettingsService);
  const coreSettings = app.injector.getServiceByClass(CoreSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(
    endpoint.query('serverConfig', mockServerConfig(equalConfig)),
  );

  await config.refresh();

  expect(settings.settings.getValue('refreshTimeout')).toBe(1);
  expect(settings.settings.getValue('maxLogRecords')).toBe(2);
  expect(settings.settings.getValue('logBatchSize')).toBe(3);
  expect(settings.settings.getValue('maxFailedRequests')).toBe(4);
  expect(coreSettings.settings.getValue('app.logViewer.refreshTimeout')).toBe(1);
  expect(coreSettings.settings.getValue('app.logViewer.maxLogRecords')).toBe(2);
  expect(coreSettings.settings.getValue('app.logViewer.logBatchSize')).toBe(3);
  expect(coreSettings.settings.getValue('app.logViewer.maxFailedRequests')).toBe(4);
});