/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { coreAppManifest } from '@cloudbeaver/core-app';
import { coreAuthenticationManifest } from '@cloudbeaver/core-authentication';
import { mockAuthentication } from '@cloudbeaver/core-authentication/dist/__custom_mocks__/mockAuthentication';
import { coreBrowserManifest } from '@cloudbeaver/core-browser';
import { coreClientActivityManifest } from '@cloudbeaver/core-client-activity';
import { coreEventsManifest } from '@cloudbeaver/core-events';
import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
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
import { createApp } from '@cloudbeaver/tests-runner';

import { coreNavigationTree } from './manifest';
import { NavTreeSettings, NavTreeSettingsService } from './NavTreeSettingsService';

const endpoint = createGQLEndpoint();
const app = createApp(
  coreNavigationTree,
  coreEventsManifest,
  corePluginManifest,
  coreProductManifest,
  coreRootManifest,
  coreSDKManifest,
  coreSettingsManifest,
  coreBrowserManifest,
  coreRoutingManifest,
  coreThemingManifest,
  coreLocalizationManifest,
  coreAuthenticationManifest,
  coreAppManifest,
  coreProjectsManifest,
  coreUIManifest,
  coreViewManifest,
  coreClientActivityManifest,
);

const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));

beforeAll(() => app.init());

const deprecatedSettings = {
  'core.app': {
    navigationTree: {
      childrenLimit: 1,
    },
    metadata: {
      editing: false,
      deleting: false,
    },
  },
};

const newSettings = {
  ...deprecatedSettings,
  core: {
    'navigation-tree': {
      childrenLimit: 2,
      editing: true,
      deleting: true,
    } as NavTreeSettings,
  },
};

test('New settings override deprecated', async () => {
  const settings = app.injector.getServiceByClass(NavTreeSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(newSettings)));

  await config.refresh();

  expect(settings.settings.getValue('childrenLimit')).toBe(2);
  expect(settings.settings.getValue('editing')).toBe(true);
  expect(settings.settings.getValue('deleting')).toBe(true);
});

test('Deprecated settings are used if new settings are not defined', async () => {
  const settings = app.injector.getServiceByClass(NavTreeSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(deprecatedSettings)));

  await config.refresh();

  expect(settings.settings.getValue('childrenLimit')).toBe(1);
  expect(settings.settings.getValue('editing')).toBe(false);
  expect(settings.settings.getValue('deleting')).toBe(false);
});
