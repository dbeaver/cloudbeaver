/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe } from 'vitest';

// import { coreAdministrationManifest } from '@cloudbeaver/core-administration';
// import { coreAppManifest } from '@cloudbeaver/core-app';
// import { coreAuthenticationManifest } from '@cloudbeaver/core-authentication';
// import { mockAuthentication } from '@cloudbeaver/core-authentication/__custom_mocks__/mockAuthentication.js';
// import { coreBrowserManifest } from '@cloudbeaver/core-browser';
// import { coreClientActivityManifest } from '@cloudbeaver/core-client-activity';
// import { coreConnectionsManifest } from '@cloudbeaver/core-connections';
// import { coreDialogsManifest } from '@cloudbeaver/core-dialogs';
// import { coreEventsManifest } from '@cloudbeaver/core-events';
// import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
// import { coreNavigationTree } from '@cloudbeaver/core-navigation-tree';
// import { coreProjectsManifest } from '@cloudbeaver/core-projects';
// import { coreRootManifest, ServerConfigResource } from '@cloudbeaver/core-root';
// import { createGQLEndpoint } from '@cloudbeaver/core-root/__custom_mocks__/createGQLEndpoint.js';
// import '@cloudbeaver/core-root/__custom_mocks__/expectWebsocketClosedMessage.js';
// import { mockAppInit } from '@cloudbeaver/core-root/__custom_mocks__/mockAppInit.js';
// import { mockGraphQL } from '@cloudbeaver/core-root/__custom_mocks__/mockGraphQL.js';
// import { mockServerConfig } from '@cloudbeaver/core-root/__custom_mocks__/resolvers/mockServerConfig.js';
// import { coreRoutingManifest } from '@cloudbeaver/core-routing';
// import { coreSDKManifest } from '@cloudbeaver/core-sdk';
// import { coreSettingsManifest } from '@cloudbeaver/core-settings';
// import {
//   expectDeprecatedSettingMessage,
//   expectNoDeprecatedSettingMessage,
// } from '@cloudbeaver/core-settings/__custom_mocks__/expectDeprecatedSettingMessage.js';
// import { coreStorageManifest } from '@cloudbeaver/core-storage';
// import { coreUIManifest } from '@cloudbeaver/core-ui';
// import { coreViewManifest } from '@cloudbeaver/core-view';
// import { dataViewerManifest } from '@cloudbeaver/plugin-data-viewer';
// import { datasourceContextSwitchPluginManifest } from '@cloudbeaver/plugin-datasource-context-switch';
// import { navigationTabsPlugin } from '@cloudbeaver/plugin-navigation-tabs';
// import { navigationTreePlugin } from '@cloudbeaver/plugin-navigation-tree';
// import { objectViewerManifest } from '@cloudbeaver/plugin-object-viewer';
// import { createApp } from '@cloudbeaver/tests-runner';

// import { DataGridSettingsService } from './DataGridSettingsService.js';
// import { dataSpreadsheetNewManifest } from './manifest.js';

// const endpoint = createGQLEndpoint();
// const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));
// const app = createApp(
//   dataSpreadsheetNewManifest,
//   coreLocalizationManifest,
//   coreEventsManifest,
//   coreRootManifest,
//   coreSDKManifest,
//   coreBrowserManifest,
//   coreSettingsManifest,
//   coreViewManifest,
//   coreStorageManifest,
//   coreAuthenticationManifest,
//   coreProjectsManifest,
//   coreUIManifest,
//   coreRoutingManifest,
//   coreAdministrationManifest,
//   coreConnectionsManifest,
//   coreDialogsManifest,
//   coreNavigationTree,
//   coreAppManifest,
//   datasourceContextSwitchPluginManifest,
//   navigationTreePlugin,
//   navigationTabsPlugin,
//   objectViewerManifest,
//   dataViewerManifest,
//   coreClientActivityManifest,
// );

// const testValueDeprecated = true;
// const testValueNew = false;

// const deprecatedSettings = {
//   'plugin_data_spreadsheet_new.hidden': testValueDeprecated,
// };

// const newSettings = {
//   ...deprecatedSettings,
//   'plugin.data-spreadsheet.hidden': testValueNew,
// };

// test('New settings override deprecated', async () => {
//   const settings = app.serviceProvider.getService(DataGridSettingsService);
//   const config = app.serviceProvider.getService(ServerConfigResource);

//   server.use(endpoint.query('serverConfig', mockServerConfig(newSettings)));

//   await config.refresh();

//   expect(settings.hidden).toBe(testValueNew);
//   expectNoDeprecatedSettingMessage();
// });

// test('Deprecated settings are used if new settings are not defined', async () => {
//   const settings = app.serviceProvider.getService(DataGridSettingsService);
//   const config = app.serviceProvider.getService(ServerConfigResource);

//   server.use(endpoint.query('serverConfig', mockServerConfig(deprecatedSettings)));

//   await config.refresh();

//   expect(settings.hidden).toBe(testValueDeprecated);
//   expectDeprecatedSettingMessage();
// });

describe.skip('DataGridSettingsService', () => {});
