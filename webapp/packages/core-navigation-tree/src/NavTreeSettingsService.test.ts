/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe } from 'vitest';

// import { coreAuthenticationManifest } from '@cloudbeaver/core-authentication';
// import { mockAuthentication } from '@cloudbeaver/core-authentication/__custom_mocks__/mockAuthentication.js';
// import { coreBrowserManifest } from '@cloudbeaver/core-browser';
// import { coreClientActivityManifest } from '@cloudbeaver/core-client-activity';
// import { coreEventsManifest } from '@cloudbeaver/core-events';
// import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
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
// import { createApp } from '@cloudbeaver/tests-runner';

// import { coreNavigationTree } from './manifest.js';
// import { NavTreeSettingsService } from './NavTreeSettingsService.js';

// const endpoint = createGQLEndpoint();
// const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));
// const app = createApp(
//   coreNavigationTree,
//   coreEventsManifest,
//   coreStorageManifest,
//   coreRootManifest,
//   coreSDKManifest,
//   coreSettingsManifest,
//   coreBrowserManifest,
//   coreRoutingManifest,
//   coreLocalizationManifest,
//   coreAuthenticationManifest,
//   coreProjectsManifest,
//   coreUIManifest,
//   coreViewManifest,
//   coreClientActivityManifest,
// );

// const deprecatedSettings = {
//   'core.app.navigationTree.childrenLimit': 100,
//   'core.app.metadata.editing': false,
//   'core.app.metadata.deleting': false,
// };

// const newSettings = {
//   ...deprecatedSettings,
//   'core.navigation-tree.childrenLimit': 200,
//   'core.navigation-tree.editing': true,
//   'core.navigation-tree.deleting': true,
// };

// test('New settings override deprecated', async () => {
//   const settings = app.serviceProvider.getService(NavTreeSettingsService);
//   const config = app.serviceProvider.getService(ServerConfigResource);

//   server.use(endpoint.query('serverConfig', mockServerConfig(newSettings)));

//   await config.refresh();

//   expect(settings.childrenLimit).toBe(200);
//   expect(settings.editing).toBe(true);
//   expect(settings.deleting).toBe(true);
//   expectNoDeprecatedSettingMessage();
// });

// test('Deprecated settings are used if new settings are not defined', async () => {
//   const settings = app.serviceProvider.getService(NavTreeSettingsService);
//   const config = app.serviceProvider.getService(ServerConfigResource);

//   server.use(endpoint.query('serverConfig', mockServerConfig(deprecatedSettings)));

//   await config.refresh();

//   expect(settings.childrenLimit).toBe(100);
//   expect(settings.editing).toBe(false);
//   expect(settings.deleting).toBe(false);
//   expectDeprecatedSettingMessage();
// });

describe.skip('NavTreeSettingsService', () => {});
