/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { CoreSettingsService } from '@cloudbeaver/core-app';
import { mockAuthentication } from '@cloudbeaver/core-authentication/mocks/mockAuthentication';
import { createApp } from '@cloudbeaver/core-cli/tests/utils/createApp';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { createGQLEndpoint } from '@cloudbeaver/core-root/mocks/createGQLEndpoint';
import { mockAppInit } from '@cloudbeaver/core-root/mocks/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/mocks/mockGraphQL';
import { mockServerConfig } from '@cloudbeaver/core-root/mocks/resolvers/mockServerConfig';

import { NavTreeSettings, NavTreeSettingsService } from './NavTreeSettingsService';

const endpoint = createGQLEndpoint();
const app = createApp();

const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));

beforeAll(() => app.init());

const equalConfig = {
  core: {
    app: {
      navigationTree: {
        childrenLimit: 1,
      },
      metadata: {
        editing: false,
        deleting: false,
      },
    },
    'navigation-tree': {
      childrenLimit: 1,
      editing: false,
      deleting: false,
    } as NavTreeSettings,
  },
};

test('New settings equal deprecated settings', async () => {
  const settings = app.injector.getServiceByClass(NavTreeSettingsService);
  const coreSettings = app.injector.getServiceByClass(CoreSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfig)));

  await config.refresh();

  expect(settings.settings.getValue('childrenLimit')).toBe(1);
  expect(settings.settings.getValue('editing')).toBe(false);
  expect(settings.settings.getValue('deleting')).toBe(false);
  expect(coreSettings.settings.getValue('app.navigationTree.childrenLimit')).toBe(1);
  expect(coreSettings.settings.getValue('app.metadata.editing')).toBe(false);
  expect(coreSettings.settings.getValue('app.metadata.deleting')).toBe(false);
});
