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

// import { EventsSettingsService } from './EventsSettingsService.js';
// import { coreEventsManifest } from './manifest.js';

// const endpoint = createGQLEndpoint();
// const server = mockGraphQL(...mockAppInit(endpoint));
// const app = createApp(
//   coreEventsManifest,
//   coreSettingsManifest,
//   coreLocalizationManifest,
//   coreRootManifest,
//   coreSDKManifest,
//   coreClientActivityManifest,
// );

// const oldConfig = {
//   'core_events.notificationsPool': '1',
//   'core_events.maxPersistentAllow': '2',
// };

// const overrideConfig = {
//   ...oldConfig,
//   'plugin.notifications.notificationsPool': '3',
//   'plugin.notifications.maxPersistentAllow': '4',
// };

// test('New settings override deprecated settings', async () => {
//   const settings = app.serviceProvider.getService(EventsSettingsService);
//   const config = app.serviceProvider.getService(ServerConfigResource);

//   server.use(endpoint.query('serverConfig', mockServerConfig(overrideConfig)));

//   await config.refresh();

//   expect(settings.notificationsPool).toBe(3);
//   expect(settings.maxPersistentAllow).toBe(4);
//   expectNoDeprecatedSettingMessage();
// });

// test('Deprecated settings accessible with new settings', async () => {
//   const settings = app.serviceProvider.getService(EventsSettingsService);
//   const config = app.serviceProvider.getService(ServerConfigResource);

//   server.use(endpoint.query('serverConfig', mockServerConfig(oldConfig)));

//   await config.refresh();

//   expect(settings.notificationsPool).toBe(1);
//   expect(settings.maxPersistentAllow).toBe(2);
//   expectDeprecatedSettingMessage();
// });

describe.skip('EventsSettingsService', () => {});
