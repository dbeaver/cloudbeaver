/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export const defaultProductConfiguration: Record<string, any> = {
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
};