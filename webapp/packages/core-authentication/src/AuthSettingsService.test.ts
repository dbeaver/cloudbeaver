/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

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
import { expectNoDeprecatedSettingMessage } from '@cloudbeaver/core-settings/dist/__custom_mocks__/expectDeprecatedSettingMessage';
import { createApp } from '@cloudbeaver/tests-runner';

import { mockAuthentication } from './__custom_mocks__/mockAuthentication';
import { AuthSettingsService } from './AuthSettingsService';
import { coreAuthenticationManifest } from './manifest';

const endpoint = createGQLEndpoint();
const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));
const app = createApp(
  coreAuthenticationManifest,
  coreRootManifest,
  coreSDKManifest,
  coreSettingsManifest,
  coreRoutingManifest,
  coreLocalizationManifest,
  coreClientActivityManifest,
);

const equalConfig = {
  'core.authentication.disableAnonymousAccess': true,
};

test('Read settings', async () => {
  const settings = app.injector.getServiceByClass(AuthSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfig)));

  await config.refresh();

  expect(settings.disableAnonymousAccess).toBe(true);
  expectNoDeprecatedSettingMessage();
});
