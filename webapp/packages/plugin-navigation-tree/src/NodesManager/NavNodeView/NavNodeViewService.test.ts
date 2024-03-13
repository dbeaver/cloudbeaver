/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { coreAdministrationManifest } from '@cloudbeaver/core-administration';
import { coreAppManifest } from '@cloudbeaver/core-app';
import { coreAuthenticationManifest } from '@cloudbeaver/core-authentication';
import { mockAuthentication } from '@cloudbeaver/core-authentication/dist/__custom_mocks__/mockAuthentication';
import { coreBrowserManifest } from '@cloudbeaver/core-browser';
import { coreClientActivityManifest } from '@cloudbeaver/core-client-activity';
import { coreConnectionsManifest } from '@cloudbeaver/core-connections';
import { coreDialogsManifest } from '@cloudbeaver/core-dialogs';
import { coreEventsManifest } from '@cloudbeaver/core-events';
import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
import { coreNavigationTree } from '@cloudbeaver/core-navigation-tree';
import { corePluginManifest } from '@cloudbeaver/core-plugin';
import { coreProductManifest } from '@cloudbeaver/core-product';
import { coreProjectsManifest } from '@cloudbeaver/core-projects';
import { coreRootManifest } from '@cloudbeaver/core-root';
import { createGQLEndpoint } from '@cloudbeaver/core-root/dist/__custom_mocks__/createGQLEndpoint';
import { mockAppInit } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockGraphQL';
import { coreRoutingManifest } from '@cloudbeaver/core-routing';
import { coreSDKManifest } from '@cloudbeaver/core-sdk';
import { coreSettingsManifest } from '@cloudbeaver/core-settings';
import { coreThemingManifest } from '@cloudbeaver/core-theming';
import { coreUIManifest } from '@cloudbeaver/core-ui';
import { coreViewManifest } from '@cloudbeaver/core-view';
import { datasourceContextSwitchPluginManifest } from '@cloudbeaver/plugin-datasource-context-switch';
import { navigationTabsPlugin } from '@cloudbeaver/plugin-navigation-tabs';
import { createApp, getService } from '@cloudbeaver/tests-runner';

import { navigationTreePlugin } from '../../manifest';
import { NavNodeViewService } from './NavNodeViewService';

const endpoint = createGQLEndpoint();
const app = createApp(
  navigationTreePlugin,
  coreLocalizationManifest,
  coreEventsManifest,
  corePluginManifest,
  coreProductManifest,
  coreRootManifest,
  coreSDKManifest,
  coreBrowserManifest,
  coreSettingsManifest,
  coreViewManifest,
  coreAuthenticationManifest,
  coreProjectsManifest,
  coreUIManifest,
  coreRoutingManifest,
  coreAdministrationManifest,
  coreConnectionsManifest,
  coreDialogsManifest,
  datasourceContextSwitchPluginManifest,
  navigationTabsPlugin,
  coreNavigationTree,
  coreAppManifest,
  coreThemingManifest,
  coreClientActivityManifest,
);

mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));

beforeAll(() => app.init());

describe('filterDuplicates', () => {
  test('Filter duplicates', async () => {
    const navNodeViewService = getService(app, NavNodeViewService);

    const { nodes, duplicates } = navNodeViewService.filterDuplicates(['0', '1', '2', '3', '0', '3']);

    expect(nodes).toEqual(['1', '2']);
    expect(duplicates).toEqual(['0', '3']);
  });

  test('No duplicates', async () => {
    const navNodeViewService = getService(app, NavNodeViewService);
    const { nodes, duplicates } = navNodeViewService.filterDuplicates(['1', '2', '0']);

    expect(nodes).toEqual(['1', '2', '0']);
    expect(duplicates).toEqual([]);
  });

  test('Empty list', async () => {
    const navNodeViewService = getService(app, NavNodeViewService);

    const { nodes, duplicates } = navNodeViewService.filterDuplicates([]);

    expect(nodes).toEqual([]);
    expect(duplicates).toEqual([]);
  });

  test('Only duplicates', async () => {
    const navNodeViewService = getService(app, NavNodeViewService);

    const { nodes, duplicates } = navNodeViewService.filterDuplicates(['0', '1', '0', '1', '2', '3', '2', '3']);

    expect(nodes).toEqual([]);
    expect(duplicates).toEqual(['0', '1', '2', '3']);
  });
});
