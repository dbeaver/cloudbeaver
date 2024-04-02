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
import '@cloudbeaver/core-root/dist/__custom_mocks__/expectWebsocketClosedMessage';
import { mockAppInit } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockGraphQL';
import { mockServerConfig } from '@cloudbeaver/core-root/dist/__custom_mocks__/resolvers/mockServerConfig';
import { coreRoutingManifest } from '@cloudbeaver/core-routing';
import { coreSDKManifest } from '@cloudbeaver/core-sdk';
import { coreSettingsManifest } from '@cloudbeaver/core-settings';
import {
  expectDeprecatedSettingMessage,
  expectNoDeprecatedSettingMessage,
} from '@cloudbeaver/core-settings/dist/__custom_mocks__/expectDeprecatedSettingMessage';
import { coreStorageManifest } from '@cloudbeaver/core-storage';
import { coreViewManifest } from '@cloudbeaver/core-view';
import toolsPanelPlugin from '@cloudbeaver/plugin-tools-panel';
import { createApp } from '@cloudbeaver/tests-runner';

import { logViewerPlugin } from '../manifest';
import { LogViewerSettingsService } from './LogViewerSettingsService';

const endpoint = createGQLEndpoint();
const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));
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

const deprecatedSettings = {
  'core.app.logViewer.refreshTimeout': 1,
  'core.app.logViewer.maxLogRecords': 2,
  'core.app.logViewer.logBatchSize': 3,
  'core.app.logViewer.maxFailedRequests': 4,
  'core.app.logViewer.disabled': true,
};

const newSettings = {
  ...deprecatedSettings,
  'plugin.log-viewer.refreshTimeout': 5,
  'plugin.log-viewer.maxLogRecords': 6,
  'plugin.log-viewer.logBatchSize': 7,
  'plugin.log-viewer.maxFailedRequests': 8,
  'plugin.log-viewer.disabled': false,
};

test('New settings override deprecated settings', async () => {
  const settings = app.injector.getServiceByClass(LogViewerSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(newSettings)));

  await config.refresh();

  expect(settings.refreshTimeout).toBe(5);
  expect(settings.maxLogRecords).toBe(6);
  expect(settings.logBatchSize).toBe(7);
  expect(settings.maxFailedRequests).toBe(8);
  expect(settings.disabled).toBe(false);
  expectNoDeprecatedSettingMessage();
});

test('Deprecated settings are used if new settings are not defined', async () => {
  const settings = app.injector.getServiceByClass(LogViewerSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(deprecatedSettings)));

  await config.refresh();

  expect(settings.refreshTimeout).toBe(1);
  expect(settings.maxLogRecords).toBe(2);
  expect(settings.logBatchSize).toBe(3);
  expect(settings.maxFailedRequests).toBe(4);
  expect(settings.disabled).toBe(true);
  expectDeprecatedSettingMessage();
});
