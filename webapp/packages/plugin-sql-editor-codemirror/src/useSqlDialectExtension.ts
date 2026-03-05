/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useMemo } from 'react';

import { createLazyLoader, useLazyImport } from '@cloudbeaver/core-blocks';
import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';
import type { Compartment, Extension } from '@cloudbeaver/plugin-codemirror6';

const codemirrorPluginLoader = createLazyLoader(() => import('@cloudbeaver/plugin-codemirror6'));

export function useSqlDialectExtension(dialectInfo?: SqlDialectInfo): [Compartment, Extension] | null {
  const codemirror = useLazyImport(codemirrorPluginLoader);
  const loader = getDialectLoader(codemirror, dialectInfo?.name);
  const dialect = useLazyImport(loader);
  const SQL_EDITOR_COMPARTMENT = useMemo(() => {
    if (!codemirror) {
      return null;
    }
    return new codemirror.Compartment();
  }, [codemirror]);

  return useMemo(() => {
    if (!dialect || !codemirror || !SQL_EDITOR_COMPARTMENT) {
      return null;
    }
    let dialectInner = dialect;

    if (dialectInfo) {
      dialectInner = codemirror.SQLDialect.define({
        keywords: dialectInfo.reservedWords.join(' ').toLowerCase(),
        builtin: dialectInfo.functions.join(' ').toUpperCase(),
        types: dialectInfo.dataTypes.join(' ').toUpperCase(),

        hashComments: dialectInfo.singleLineComments.includes('#'),
        slashComments: dialectInfo.singleLineComments.includes('//'),
        doubleDollarQuotedStrings: dialectInfo.quoteStrings.some(v => v.includes('$$')),
        doubleQuotedStrings: dialectInfo.quoteStrings.some(v => v.includes('"')),
      });
    }

    return [
      SQL_EDITOR_COMPARTMENT,
      codemirror.SQL_EDITOR({
        dialect: dialectInner,
      }),
    ];
  }, [SQL_EDITOR_COMPARTMENT, codemirror, dialect, dialectInfo]);
}

const emptyDialectLoader = createLazyLoader(() => Promise.resolve(null));

function getDialectLoader(plugin: typeof import('@cloudbeaver/plugin-codemirror6') | null, name?: string) {
  if (!plugin) {
    return emptyDialectLoader;
  }

  switch (name) {
    case 'PostgreSQL':
      return plugin.PostgreSQLLoader;
    case 'MySQL':
      return plugin.MySQLLoader;
    case 'MariaSQL':
      return plugin.MariaSQLLoader;
    case 'SQLServer':
      return plugin.MSSQLLoader;
    case 'SQLite':
      return plugin.SQLiteLoader;
    case 'CQL':
      return plugin.CassandraLoader;
    case 'PLSQL':
      return plugin.PLSQLLoader;
    default:
      return plugin.StandardSQLLoader;
  }
}
