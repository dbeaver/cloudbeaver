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

// import { coreSettingsLocalizationManifest } from './manifest.js';
// import { SettingsLocalizationService } from './SettingsLocalizationService.js';

// const endpoint = createGQLEndpoint();
// const server = mockGraphQL(...mockAppInit(endpoint));
// const app = createApp(
//   coreSettingsLocalizationManifest,
//   coreClientActivityManifest,
//   coreSettingsManifest,
//   coreLocalizationManifest,
//   coreRootManifest,
//   coreSDKManifest,
// );

// const deprecatedValue = 'es';
// const value = 'te';

// const deprecatedSettings = {
//   'core.user.defaultLanguage': deprecatedValue,
//   'core.localization.defaultLanguage': deprecatedValue,
//   'app.defaultLanguage': deprecatedValue,
// };

// const newSettings = {
//   ...deprecatedSettings,
//   'core.localization.language': value,
// };

// test('New settings override deprecated settings', async () => {
//   const settings = app.serviceProvider.getService(SettingsLocalizationService);
//   const config = app.serviceProvider.getService(ServerConfigResource);

//   server.use(endpoint.query('serverConfig', mockServerConfig(newSettings)));

//   await config.refresh();

//   expect(settings.language).toBe(value);
//   expectNoDeprecatedSettingMessage();
// });

// test('Deprecated settings are used if new settings are not defined', async () => {
//   const settings = app.serviceProvider.getService(SettingsLocalizationService);
//   const config = app.serviceProvider.getService(ServerConfigResource);

//   server.use(endpoint.query('serverConfig', mockServerConfig(deprecatedSettings)));

//   await config.refresh();

//   expect(settings.language).toBe(deprecatedValue);
//   expectDeprecatedSettingMessage();
// });

describe.skip('SettingsLocalizationService', () => {});
