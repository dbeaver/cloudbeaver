/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { coreAdministrationManifest } from '@cloudbeaver/core-administration';
import { coreAppManifest } from '@cloudbeaver/core-app';
import { coreAuthenticationManifest } from '@cloudbeaver/core-authentication';
import { mockAuthentication } from '@cloudbeaver/core-authentication/dist/__custom_mocks__/mockAuthentication';
import { coreBrowserManifest } from '@cloudbeaver/core-browser';
import { coreClientActivityManifest } from '@cloudbeaver/core-client-activity';
import { coreConnectionsManifest } from '@cloudbeaver/core-connections';
import { coreDialogsManifest } from '@cloudbeaver/core-dialogs';
import { coreEventsManifest } from '@cloudbeaver/core-events';
import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
import { coreNavigationTree } from '@cloudbeaver/core-navigation-tree';
import { coreProjectsManifest } from '@cloudbeaver/core-projects';
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
import { coreUIManifest } from '@cloudbeaver/core-ui';
import { coreViewManifest } from '@cloudbeaver/core-view';
import { datasourceContextSwitchPluginManifest } from '@cloudbeaver/plugin-datasource-context-switch';
import { navigationTabsPlugin } from '@cloudbeaver/plugin-navigation-tabs';
import { navigationTreePlugin } from '@cloudbeaver/plugin-navigation-tree';
import { objectViewerManifest } from '@cloudbeaver/plugin-object-viewer';
import { createApp } from '@cloudbeaver/tests-runner';

import { DataExportSettingsService } from './DataExportSettingsService';
import { dataExportManifest } from './manifest';

const endpoint = createGQLEndpoint();
const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));
const app = createApp(
  dataExportManifest,
  coreLocalizationManifest,
  coreEventsManifest,
  coreRootManifest,
  coreSDKManifest,
  coreBrowserManifest,
  coreSettingsManifest,
  coreStorageManifest,
  coreViewManifest,
  coreAuthenticationManifest,
  coreProjectsManifest,
  coreUIManifest,
  coreRoutingManifest,
  coreAdministrationManifest,
  coreConnectionsManifest,
  coreDialogsManifest,
  coreNavigationTree,
  coreAppManifest,
  datasourceContextSwitchPluginManifest,
  navigationTreePlugin,
  navigationTabsPlugin,
  objectViewerManifest,
  coreClientActivityManifest,
);

const testValueA = true;
const testValueB = true;

const deprecatedSettings = {
  'plugin_data_export.disabled': testValueB,
};

const newSettings = {
  ...deprecatedSettings,
  'plugin.data-export.disabled': testValueA,
};

test('New settings override deprecated', async () => {
  const settings = app.injector.getServiceByClass(DataExportSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(newSettings)));

  await config.refresh();

  expect(settings.disabled).toBe(testValueA);
  expectNoDeprecatedSettingMessage();
});

test('Deprecated settings are used if new settings are not defined', async () => {
  const settings = app.injector.getServiceByClass(DataExportSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(deprecatedSettings)));

  await config.refresh();

  expect(settings.disabled).toBe(testValueB);
  expectDeprecatedSettingMessage();
});
