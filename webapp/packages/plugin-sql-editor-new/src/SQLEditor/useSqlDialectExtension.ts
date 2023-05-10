/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo } from 'react';

import { IComplexLoaderData, useComplexLoader } from '@cloudbeaver/core-blocks';
import { CassandraLoader, Extension, MSSQLLoader, MariaSQLLoader, MySQLLoader, PLSQLLoader, PostgreSQLLoader, SQLDialect, SQL_EDITOR, SQLiteLoader, StandardSQLLoader } from '@cloudbeaver/plugin-codemirror6';
import type { ISQLEditorData } from '@cloudbeaver/plugin-sql-editor';

export function useSqlDialectExtension(data: ISQLEditorData): Extension {
  const loader = getDialectLoader(data.dialect?.name);
  const dialect = useComplexLoader(loader);

  return useMemo(() => {
    let dialectInner = dialect;

    if (data.dialect) {
      dialectInner = SQLDialect.define({
        keywords: data.dialect.reservedWords.join(' ').toLowerCase(),
        builtin: data.dialect.functions.join(' ').toUpperCase(),
        types: data.dialect.dataTypes.join(' ').toUpperCase(),

        hashComments: data.dialect.singleLineComments.includes('#'),
        slashComments: data.dialect.singleLineComments.includes('//'),
        doubleDollarQuotedStrings: data.dialect.quoteStrings.some(v => v.includes('$$')),
        doubleQuotedStrings: data.dialect.quoteStrings.some(v => v.includes('"')),
      });
    }

    return SQL_EDITOR({
      dialect: dialectInner,
    });
  }, [dialect, data.dialect]);
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