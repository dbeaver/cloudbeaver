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
// import { datasourceContextSwitchPluginManifest } from '@cloudbeaver/plugin-datasource-context-switch';
// import { navigationTabsPlugin } from '@cloudbeaver/plugin-navigation-tabs';
// import { navigationTreePlugin } from '@cloudbeaver/plugin-navigation-tree';
// import { objectViewerManifest } from '@cloudbeaver/plugin-object-viewer';
// import { createApp } from '@cloudbeaver/tests-runner';

// import { DataViewerSettingsService } from './DataViewerSettingsService.js';
// import { dataViewerManifest } from './manifest.js';

// const endpoint = createGQLEndpoint();
// const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));
// const app = createApp(
//   dataViewerManifest,
//   coreLocalizationManifest,
//   coreEventsManifest,
//   coreSDKManifest,
//   coreClientActivityManifest,
//   coreRootManifest,
//   coreBrowserManifest,
//   coreStorageManifest,
//   coreSettingsManifest,
//   coreViewManifest,
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
// );

// const testValueDeprecated = true;
// const testValueNew = false;

// const deprecatedSettings = {
//   'core.app.dataViewer.disableEdit': testValueDeprecated,
//   'plugin.data-viewer.disabled': testValueDeprecated,
//   'plugin_data_export.disabled': testValueDeprecated,
// };

// const newSettings = {
//   ...deprecatedSettings,
//   'plugin.data-viewer.disableEdit': testValueNew,
//   'plugin.data-viewer.export.disabled': testValueNew,
// };

// async function setupSettingsService(mockConfig: any = {}) {
//   const settings = app.serviceProvider.getService(DataViewerSettingsService);
//   const config = app.serviceProvider.getService(ServerConfigResource);

//   server.use(endpoint.query('serverConfig', mockServerConfig(mockConfig)));

//   await config.refresh();

//   return settings;
// }

// test('New settings override deprecated settings', async () => {
//   const settingsService = await setupSettingsService(newSettings);

//   expect(settingsService.disableEdit).toBe(testValueNew);
//   expect(settingsService.disableExportData).toBe(testValueNew);

//   expectNoDeprecatedSettingMessage();
// });

// test('Deprecated settings are used if new settings are not defined', async () => {
//   const settingsService = await setupSettingsService(deprecatedSettings);

//   expect(settingsService.disableEdit).toBe(testValueDeprecated);
//   expect(settingsService.disableExportData).toBe(testValueDeprecated);

//   expectDeprecatedSettingMessage();
// });

// describe('DataViewerSettingsService.getDefaultRowsCount', () => {
//   let settingsService: DataViewerSettingsService = null as any;

//   beforeAll(async () => {
//     settingsService = await setupSettingsService({
//       'plugin.data-viewer.fetchMax': '1000',
//       'plugin.data-viewer.fetchDefault': '300',
//     });
//   });

//   test('should return valid value', () => {
//     expect(settingsService.getDefaultRowsCount(400)).toBe(400);
//   });

//   test('should return valid default value', () => {
//     expect(settingsService.getDefaultRowsCount()).toBe(300);
//   });

//   test('should return valid minimal value', () => {
//     expect(settingsService.getDefaultRowsCount(10)).toBe(10);
//   });

//   test('should return valid maximal value', () => {
//     expect(settingsService.getDefaultRowsCount(1100)).toBe(1000);
//   });
// });

describe.skip('DataViewerSettingsService', () => {});
