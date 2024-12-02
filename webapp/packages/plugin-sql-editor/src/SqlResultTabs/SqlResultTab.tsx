/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { useDataContext, useDataContextLink } from '@cloudbeaver/core-data-context';
import { type ITabData, Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import { CaptureViewContext } from '@cloudbeaver/core-view';

import type { ISqlEditorResultTab } from '../ISqlEditorTabState.js';
import { DATA_CONTEXT_SQL_EDITOR_RESULT_ID } from './DATA_CONTEXT_SQL_EDITOR_RESULT_ID.js';

interface Props {
  result: ISqlEditorResultTab;
  className?: string;
  onClose?: (tab: ITabData) => Promise<void>;
}

export const SqlResultTab = observer<Props>(function SqlResultTab({ result, className, onClose }) {
  const viewContext = useContext(CaptureViewContext);
  const tabMenuContext = useDataContext(viewContext);

  useDataContextLink(tabMenuContext, (context, id) => {
    context.set(DATA_CONTEXT_SQL_EDITOR_RESULT_ID, result, id);
  });

  return (
    <Tab key={result.id} tabId={result.id} title={result.name} menuContext={tabMenuContext} className={className} onClose={onClose}>
      <TabIcon icon={result.icon} />
      <TabTitle>{result.name}</TabTitle>
    </Tab>
  );
});
