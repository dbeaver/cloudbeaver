/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { coreAppManifest } from '@cloudbeaver/core-app';
import { coreAuthenticationManifest } from '@cloudbeaver/core-authentication';
import { mockAuthentication } from '@cloudbeaver/core-authentication/dist/__custom_mocks__/mockAuthentication';
import { coreBrowserManifest } from '@cloudbeaver/core-browser';
import { coreClientActivityManifest } from '@cloudbeaver/core-client-activity';
import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
import { coreRootManifest, ServerConfigResource } from '@cloudbeaver/core-root';
import { createGQLEndpoint } from '@cloudbeaver/core-root/dist/__custom_mocks__/createGQLEndpoint';
import { mockAppInit } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockGraphQL';
import { mockServerConfig } from '@cloudbeaver/core-root/dist/__custom_mocks__/resolvers/mockServerConfig';
import { coreRoutingManifest } from '@cloudbeaver/core-routing';
import { coreSDKManifest } from '@cloudbeaver/core-sdk';
import { coreSettingsManifest } from '@cloudbeaver/core-settings';
import { coreStorageManifest } from '@cloudbeaver/core-storage';
import { coreViewManifest } from '@cloudbeaver/core-view';
import toolsPanelPlugin from '@cloudbeaver/plugin-tools-panel';
import { createApp } from '@cloudbeaver/tests-runner';

import { logViewerPlugin } from '../manifest';
import { LogViewerSettings, LogViewerSettingsService } from './LogViewerSettingsService';

const endpoint = createGQLEndpoint();
const app = createApp(
  logViewerPlugin,
  toolsPanelPlugin,
  coreRootManifest,
  coreStorageManifest,
  coreSDKManifest,
  coreViewManifest,
  coreAuthenticationManifest,
  coreSettingsManifest,
  coreBrowserManifest,
  coreLocalizationManifest,
  coreAppManifest,
  coreRoutingManifest,
  coreClientActivityManifest,
);

const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));

beforeAll(() => app.init());

const deprecatedSettings = {
  core: {
    app: {
      logViewer: {
        refreshTimeout: 1,
        maxLogRecords: 2,
        logBatchSize: 3,
        maxFailedRequests: 4,
        disabled: true,
      } as LogViewerSettings,
    },
  },
};

const newSettings = {
  ...deprecatedSettings,
  plugin: {
    'log-viewer': {
      refreshTimeout: 5,
      maxLogRecords: 6,
      logBatchSize: 7,
      maxFailedRequests: 8,
      disabled: false,
    } as LogViewerSettings,
  },
};

test('New settings override deprecated settings', async () => {
  const settings = app.injector.getServiceByClass(LogViewerSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(newSettings)));

  await config.refresh();

  expect(settings.settings.getValue('refreshTimeout')).toBe(5);
  expect(settings.settings.getValue('maxLogRecords')).toBe(6);
  expect(settings.settings.getValue('logBatchSize')).toBe(7);
  expect(settings.settings.getValue('maxFailedRequests')).toBe(8);
  expect(settings.settings.getValue('disabled')).toBe(false);
});

test('Deprecated settings are used if new settings are not defined', async () => {
  const settings = app.injector.getServiceByClass(LogViewerSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(deprecatedSettings)));

  await config.refresh();

  expect(settings.settings.getValue('refreshTimeout')).toBe(1);
  expect(settings.settings.getValue('maxLogRecords')).toBe(2);
  expect(settings.settings.getValue('logBatchSize')).toBe(3);
  expect(settings.settings.getValue('maxFailedRequests')).toBe(4);
  expect(settings.settings.getValue('disabled')).toBe(true);
});
