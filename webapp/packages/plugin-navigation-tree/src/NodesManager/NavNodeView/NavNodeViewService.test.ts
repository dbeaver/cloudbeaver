/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import '@testing-library/jest-dom';

import { mockAuthentication } from '@cloudbeaver/core-authentication/mocks/mockAuthentication';
import { createApp } from '@cloudbeaver/core-cli/tests/utils/createApp';
import { getService } from '@cloudbeaver/core-cli/tests/utils/getService';
import { createGQLEndpoint } from '@cloudbeaver/core-root/mocks/createGQLEndpoint';
import { mockAppInit } from '@cloudbeaver/core-root/mocks/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/mocks/mockGraphQL';
import administrationPlugin from '@cloudbeaver/plugin-administration';
import authenticationPlugin from '@cloudbeaver/plugin-authentication';
import connectionsPlugin from '@cloudbeaver/plugin-connections';
import datasourceContextSwitchPlugin from '@cloudbeaver/plugin-datasource-context-switch';
import navigationTabsPlugin from '@cloudbeaver/plugin-navigation-tabs';
import topAppBarPlugin from '@cloudbeaver/plugin-top-app-bar';

import { navigationTreePlugin } from '../../manifest';
import { NavNodeViewService } from './NavNodeViewService';

const endpoint = createGQLEndpoint();
const app = createApp(
  authenticationPlugin,
  connectionsPlugin,
  administrationPlugin,
  topAppBarPlugin,
  navigationTabsPlugin,
  datasourceContextSwitchPlugin,
  navigationTreePlugin
);

mockGraphQL(
  ...mockAppInit(endpoint),
  ...mockAuthentication(endpoint)
);

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