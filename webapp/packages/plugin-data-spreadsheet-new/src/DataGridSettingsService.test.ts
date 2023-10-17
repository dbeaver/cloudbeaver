/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
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
import { coreConnectionsManifest } from '@cloudbeaver/core-connections';
import { coreDialogsManifest } from '@cloudbeaver/core-dialogs';
import { coreEventsManifest } from '@cloudbeaver/core-events';
import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
import { coreNavigationTree } from '@cloudbeaver/core-navigation-tree';
import { corePluginManifest } from '@cloudbeaver/core-plugin';
import { coreProductManifest } from '@cloudbeaver/core-product';
import { coreProjectsManifest } from '@cloudbeaver/core-projects';
import { coreRootManifest, ServerConfigResource } from '@cloudbeaver/core-root';
import { createGQLEndpoint } from '@cloudbeaver/core-root/dist/__custom_mocks__/createGQLEndpoint';
import { mockAppInit } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockGraphQL';
import { mockServerConfig } from '@cloudbeaver/core-root/dist/__custom_mocks__/resolvers/mockServerConfig';
import { coreRoutingManifest } from '@cloudbeaver/core-routing';
import { coreSDKManifest } from '@cloudbeaver/core-sdk';
import { coreSettingsManifest } from '@cloudbeaver/core-settings';
import { coreThemingManifest } from '@cloudbeaver/core-theming';
import { coreUIManifest } from '@cloudbeaver/core-ui';
import { coreViewManifest } from '@cloudbeaver/core-view';
import { dataViewerManifest } from '@cloudbeaver/plugin-data-viewer';
import { datasourceContextSwitchPluginManifest } from '@cloudbeaver/plugin-datasource-context-switch';
import { navigationTabsPlugin } from '@cloudbeaver/plugin-navigation-tabs';
import { navigationTreePlugin } from '@cloudbeaver/plugin-navigation-tree';
import { objectViewerManifest } from '@cloudbeaver/plugin-object-viewer';
import { createApp } from '@cloudbeaver/tests-runner';

import { DataGridSettings, DataGridSettingsService } from './DataGridSettingsService';
import { dataSpreadsheetNewManifest } from './manifest';

const endpoint = createGQLEndpoint();
const app = createApp(
  dataSpreadsheetNewManifest,
  coreLocalizationManifest,
  coreEventsManifest,
  corePluginManifest,
  coreProductManifest,
  coreRootManifest,
  coreSDKManifest,
  coreBrowserManifest,
  coreSettingsManifest,
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
  coreThemingManifest,
  datasourceContextSwitchPluginManifest,
  navigationTreePlugin,
  navigationTabsPlugin,
  objectViewerManifest,
  dataViewerManifest,
);

const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));

beforeAll(() => app.init());

const testValueA = true;
const testValueB = false;

const equalConfigA = {
  plugin_data_spreadsheet_new: {
    hidden: testValueA,
  } as DataGridSettings,
  plugin: {
    'data-spreadsheet': {
      hidden: testValueA,
    } as DataGridSettings,
  },
};

const equalConfigB = {
  plugin_data_spreadsheet_new: {
    hidden: testValueB,
  } as DataGridSettings,
  plugin: {
    'data-spreadsheet': {
      hidden: testValueB,
    } as DataGridSettings,
  },
};

test('New settings equal deprecated settings A', async () => {
  const settings = app.injector.getServiceByClass(DataGridSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfigA)));

  await config.refresh();

  expect(settings.settings.getValue('hidden')).toBe(testValueA);
  expect(settings.deprecatedSettings.getValue('hidden')).toBe(testValueA);
});

test('New settings equal deprecated settings B', async () => {
  const settings = app.injector.getServiceByClass(DataGridSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfigB)));

  await config.refresh();

  expect(settings.settings.getValue('hidden')).toBe(testValueB);
  expect(settings.deprecatedSettings.getValue('hidden')).toBe(testValueB);
});
