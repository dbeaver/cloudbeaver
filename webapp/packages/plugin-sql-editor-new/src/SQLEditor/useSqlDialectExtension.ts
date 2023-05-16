/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo } from 'react';

import { type IComplexLoaderData, createComplexLoader, useComplexLoader } from '@cloudbeaver/core-blocks';
import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';
import { CassandraLoader, type Extension, MSSQLLoader, MariaSQLLoader, MySQLLoader, PLSQLLoader, PostgreSQLLoader, SQLDialect, SQLiteLoader, StandardSQLLoader } from '@cloudbeaver/plugin-codemirror6';

const codemirrorComplexLoader = createComplexLoader(() => import('@cloudbeaver/plugin-codemirror6'));

export function useSqlDialectExtension(dialectInfo: SqlDialectInfo | undefined): Extension {
  const { SQLDialect, SQL_EDITOR } = useComplexLoader(codemirrorComplexLoader);
  const loader = getDialectLoader(dialectInfo?.name);
  const dialect = useComplexLoader(loader);

  return useMemo(() => {
    let dialectInner = dialect;

    if (dialectInfo) {
      dialectInner = SQLDialect.define({
        keywords: dialectInfo.reservedWords.join(' ').toLowerCase(),
        builtin: dialectInfo.functions.join(' ').toUpperCase(),
        types: dialectInfo.dataTypes.join(' ').toUpperCase(),

        hashComments: dialectInfo.singleLineComments.includes('#'),
        slashComments: dialectInfo.singleLineComments.includes('//'),
        doubleDollarQuotedStrings: dialectInfo.quoteStrings.some(v => v.includes('$$')),
        doubleQuotedStrings: dialectInfo.quoteStrings.some(v => v.includes('"')),
      });
    }

    return SQL_EDITOR({
      dialect: dialectInner,
    });
  }, [dialect, dialectInfo]);
}


function getDialectLoader(name?: string): IComplexLoaderData<SQLDialect> {
  switch (name) {
    case 'PostgreSQL': return PostgreSQLLoader;
    case 'MySQL': return MySQLLoader;
    case 'MariaSQL': return MariaSQLLoader;
    case 'SQLServer': return MSSQLLoader;
    case 'SQLite': return SQLiteLoader;
    case 'CQL': return CassandraLoader;
    case 'PLSQL': return PLSQLLoader;
    default: return StandardSQLLoader;
  }
}