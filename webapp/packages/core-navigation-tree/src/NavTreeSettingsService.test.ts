/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { coreAppManifest, CoreSettingsService } from '@cloudbeaver/core-app';
import { coreAuthenticationManifest } from '@cloudbeaver/core-authentication';
import { mockAuthentication } from '@cloudbeaver/core-authentication/dist/__custom_mocks__/mockAuthentication';
import { coreBrowserManifest } from '@cloudbeaver/core-browser';
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
);

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
