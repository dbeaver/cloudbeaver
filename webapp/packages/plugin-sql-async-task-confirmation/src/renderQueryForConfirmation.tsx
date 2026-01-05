/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import { SQLCodeEditorLoader, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-new';
import { observer } from 'mobx-react-lite';

export function renderQueryForConfirmation(query: string): React.ReactElement {
  return <RenderQuery query={query} />;
}

const RenderQuery = observer(function RenderQuery({ query }: { query: string }) {
  const sqlDialect = useSqlDialectExtension(undefined);
  const extensions = useCodemirrorExtensions();
  if (sqlDialect) {
    extensions.set(...sqlDialect);
  }

  return <SQLCodeEditorLoader className="tw:mt-4" value={query} extensions={extensions} lineWrapping readonly />;
});
