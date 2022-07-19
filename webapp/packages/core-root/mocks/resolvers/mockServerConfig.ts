/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { GraphQLContext, GraphQLRequest, ResponseComposition } from 'msw';

import type { ServerConfigQuery, ServerConfigQueryVariables } from '@cloudbeaver/core-sdk';

export function mockServerConfig(
  req: GraphQLRequest<ServerConfigQueryVariables>,
  res: ResponseComposition<ServerConfigQuery>,
  ctx: GraphQLContext<ServerConfigQuery>
) {
  return res(
    ctx.data({
      'serverConfig': {
        'name': 'CloudBeaver CE Server',
        'version': '22.1.2.202207140640',
        'workspaceId': 'D14DGNGYNPI71M',
        'serverURL': 'https://test.ce.cloudbeaver.io',
        'rootURI': '/',
        'hostName': '931cdabfc0b3',
        'productConfiguration': {
          'core_events': {
            'notificationsPool': 5.0,
          },
          'core': {
            'user': {
              'defaultTheme': 'light',
              'defaultLanguage': 'en',
            },
            'app': {
              'logViewer': {
                'refreshTimeout': 3000.0,
                'logBatchSize': 1000.0,
                'maxLogRecords': 2000.0,
                'maxFailedRequests': 3.0,
              },
            },
            'authentication': {
              'primaryAuthProvider': 'local',
            },
          },
          'plugin_data_export': {
            'disabled': false,
          },
          'plugin_data_spreadsheet_new': {
            'hidden': false,
          },
        },
        'supportsCustomConnections': true,
        'supportsConnectionBrowser': false,
        'supportsWorkspaces': false,
        'sessionExpireTime': 6000000,
        'anonymousAccessEnabled': true,
        'adminCredentialsSaveEnabled': true,
        'publicCredentialsSaveEnabled': true,
        'resourceManagerEnabled': true,
        'licenseRequired': false,
        'licenseValid': false,
        'configurationMode': false,
        'developmentMode': false,
        'redirectOnFederatedAuth': false,
        'enabledFeatures': [],
        'enabledAuthProviders': [
          'local',
        ],
        'supportedLanguages': [
          {
            'isoCode': 'en',
            'displayName': 'English',
            'nativeName': 'English',
          },
          {
            'isoCode': 'zh',
            'displayName': 'Simplified chinese',
            'nativeName': '简体中文',
          },
          {
            'isoCode': 'ru',
            'displayName': 'Russian',
            'nativeName': 'Русский',
          },
          {
            'isoCode': 'fr',
            'displayName': 'French',
            'nativeName': 'Français',
          },
          {
            'isoCode': 'de',
            'displayName': 'German',
            'nativeName': 'Deutsch',
          },
          {
            'isoCode': 'it',
            'displayName': 'Italian',
            'nativeName': 'Italiano',
          },
          {
            'isoCode': 'ja',
            'displayName': 'Japanese',
            'nativeName': 'Japanese',
          },
          {
            'isoCode': 'es',
            'displayName': 'Spanish',
            'nativeName': 'Spanish',
          },
          {
            'isoCode': 'pt_BR',
            'displayName': 'Portuguese (BR)',
            'nativeName': 'Português Brasil',
          },
          {
            'isoCode': 'ko',
            'displayName': 'Korean',
            'nativeName': '한국어',
          },
          {
            'isoCode': 'tw',
            'displayName': 'Traditional chinese',
            'nativeName': '繁体中文',
          },
        ],
        'defaultNavigatorSettings': {
          'showSystemObjects': true,
          'showUtilityObjects': false,
          'showOnlyEntities': false,
          'mergeEntities': false,
          'hideFolders': false,
          'hideSchemas': false,
          'hideVirtualModel': false,
        },
        'resourceQuotas': {
          'dataExportFileSizeLimit': 1.0E7,
          'sqlMaxRunningQueries': 3.0,
          'sqlResultSetRowsLimit': 100000.0,
          'sqlResultSetMemoryLimit': 2000000.0,
        },
        'disabledDrivers': [],
        'productInfo': {
          'id': 'io.cloudbeaver.product.ce.product',
          'version': '22.1.2.202207140640',
          'latestVersionInfo': 'https://cloudbeaver.io/product/cloudbeaver-ce-version.json',
          'name': 'CloudBeaver CE Server',
          'description': 'Cloudbeaver Web UI Application',
          'buildTime': 'July 14, 2022',
          'releaseTime': 'July 11, 2022',
          'licenseInfo': '',
        },
      },
    }),
  );
}
