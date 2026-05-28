/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, test } from 'vitest';

import { ServerConfigResource } from '@cloudbeaver/core-root';
import { createGQLEndpoint } from '@cloudbeaver/core-root/__custom_mocks__/createGQLEndpoint.js';
import '@cloudbeaver/core-root/__custom_mocks__/expectWebsocketClosedMessage.js';
import { mockAppInit } from '@cloudbeaver/core-root/__custom_mocks__/mockAppInit.js';
import { mockGraphQL } from '@cloudbeaver/core-root/__custom_mocks__/mockGraphQL.js';
import { mockServerConfig } from '@cloudbeaver/core-root/__custom_mocks__/resolvers/mockServerConfig.js';
import { expectNoDeprecatedSettingMessage } from '@cloudbeaver/core-settings/__custom_mocks__/expectDeprecatedSettingMessage.js';
import { createApp, initKnownConsoleMessages } from '@cloudbeaver/tests-runner';

import { mockAuthentication } from './__custom_mocks__/mockAuthentication.js';
import { AuthSettingsService } from './AuthSettingsService.js';
import './module.js';
import { DEPRECATED_SETTINGS } from '@cloudbeaver/core-settings';

function resetDeprecatedSettings() {
  beforeEach(() => {
    DEPRECATED_SETTINGS.clear();
  });
}

describe.skip(() => {
  const endpoint = createGQLEndpoint();
  const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));
  const app = createApp();

  const equalConfig = {
    'core.authentication.disableAnonymousAccess': true,
  };

  initKnownConsoleMessages();
  resetDeprecatedSettings();

  test('Read settings', async () => {
    const settings = app.serviceProvider.getService(AuthSettingsService);
    const config = app.serviceProvider.getService(ServerConfigResource);

    server.use(endpoint.query('serverConfig', mockServerConfig(equalConfig)));

    await config.refresh();

    expect(settings.disableAnonymousAccess).toBe(true);
    expectNoDeprecatedSettingMessage();
  });
});
