/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { coreAppManifest, CoreSettingsService } from '@cloudbeaver/core-app';
import { coreAuthenticationManifest } from '@cloudbeaver/core-authentication';
import { mockAuthentication } from '@cloudbeaver/core-authentication/dist/__custom_mocks__/mockAuthentication';
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
import { coreViewManifest } from '@cloudbeaver/core-view';
import toolsPanelPlugin from '@cloudbeaver/plugin-tools-panel';
import { createApp } from '@cloudbeaver/tests-runner';

import { logViewerPlugin } from '../manifest';
import { LogViewerSettings, LogViewerSettingsService } from './LogViewerSettingsService';

const endpoint = createGQLEndpoint();
const app = createApp(
  logViewerPlugin,
  toolsPanelPlugin,
  corePluginManifest,
  coreProductManifest,
  coreRootManifest,
  coreSDKManifest,
  coreViewManifest,
  coreAuthenticationManifest,
  coreSettingsManifest,
  coreBrowserManifest,
  coreLocalizationManifest,
  coreEventsManifest,
  coreAppManifest,
  coreRoutingManifest,
  coreThemingManifest,
);

const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));

beforeAll(() => app.init());

const equalConfig = {
  core: {
    app: {
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
      disabled: false,
    } as LogViewerSettings,
  },
};

test('New settings equal deprecated settings', async () => {
  const settings = app.injector.getServiceByClass(LogViewerSettingsService);
  const coreSettings = app.injector.getServiceByClass(CoreSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfig)));

  await config.refresh();

  expect(settings.settings.getValue('refreshTimeout')).toBe(1);
  expect(settings.settings.getValue('maxLogRecords')).toBe(2);
  expect(settings.settings.getValue('logBatchSize')).toBe(3);
  expect(settings.settings.getValue('maxFailedRequests')).toBe(4);
  expect(settings.settings.getValue('disabled')).toBe(false);
  expect(coreSettings.settings.getValue('app.logViewer.refreshTimeout')).toBe(1);
  expect(coreSettings.settings.getValue('app.logViewer.maxLogRecords')).toBe(2);
  expect(coreSettings.settings.getValue('app.logViewer.logBatchSize')).toBe(3);
  expect(coreSettings.settings.getValue('app.logViewer.maxFailedRequests')).toBe(4);
});
