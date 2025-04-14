/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe } from 'vitest';

// import { coreClientActivityManifest } from '@cloudbeaver/core-client-activity';
// import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
// import { coreRootManifest, ServerConfigResource } from '@cloudbeaver/core-root';
// import { createGQLEndpoint } from '@cloudbeaver/core-root/__custom_mocks__/createGQLEndpoint.js';
// import '@cloudbeaver/core-root/__custom_mocks__/expectWebsocketClosedMessage.js';
// import { mockAppInit } from '@cloudbeaver/core-root/__custom_mocks__/mockAppInit.js';
// import { mockGraphQL } from '@cloudbeaver/core-root/__custom_mocks__/mockGraphQL.js';
// import { mockServerConfig } from '@cloudbeaver/core-root/__custom_mocks__/resolvers/mockServerConfig.js';
// import { coreSDKManifest } from '@cloudbeaver/core-sdk';
// import { coreSettingsManifest } from '@cloudbeaver/core-settings';
// import {
//   expectDeprecatedSettingMessage,
//   expectNoDeprecatedSettingMessage,
// } from '@cloudbeaver/core-settings/__custom_mocks__/expectDeprecatedSettingMessage.js';
// import { createApp } from '@cloudbeaver/tests-runner';

// import { BrowserSettingsService } from './BrowserSettingsService.js';
// import { coreBrowserSettingsManifest } from './manifest.js';

// const endpoint = createGQLEndpoint();
// const server = mockGraphQL(...mockAppInit(endpoint));
// const app = createApp(
//   coreBrowserSettingsManifest,
//   coreRootManifest,
//   coreSDKManifest,
//   coreSettingsManifest,
//   coreLocalizationManifest,
//   coreClientActivityManifest,
// );

// const testValueA = false;
// const testValueB = true;

// const equalConfigA = {
//   'core.cookies.disabled': testValueA,
//   'core.browser.cookies.disabled': testValueA,
// };

// const equalConfigB = {
//   'core.cookies.disabled': testValueB,
// };

// test('New settings override deprecated settings', async () => {
//   const settings = app.serviceProvider.getService(BrowserSettingsService);
//   const config = app.serviceProvider.getService(ServerConfigResource);

//   server.use(endpoint.query('serverConfig', mockServerConfig(equalConfigA)));

//   await config.refresh();

//   expect(settings.disabled).toBe(testValueA);
//   expectNoDeprecatedSettingMessage();
// });

// test('New settings fall back to deprecated settings', async () => {
//   const settings = app.serviceProvider.getService(BrowserSettingsService);
//   const config = app.serviceProvider.getService(ServerConfigResource);

//   server.use(endpoint.query('serverConfig', mockServerConfig(equalConfigB)));

//   await config.refresh();

//   expect(settings.disabled).toBe(testValueB);
//   expectDeprecatedSettingMessage();
// });

describe.skip('BrowserSettingsService', () => {});
