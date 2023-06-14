/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css } from 'reshadow';

import { TableViewerLoader } from '@cloudbeaver/plugin-data-viewer';

import type { IResultGroup, IResultTab } from '../ISqlEditorTabState';

const styles = css`
  TableViewerLoader {
    padding: 4px;
    padding-bottom: 0;
  }
`;

interface Props {
  group: IResultGroup;
  resultTab: IResultTab;
}

export const SqlResultSetPanel = observer<Props>(function SqlResultSetPanel({ group, resultTab }) {
  const [presentationId, setPresentation] = useState('');
  const [valuePresentationId, setValuePresentation] = useState<string | null>(null);

  return styled(styles)(
    <TableViewerLoader
      tableId={group.modelId}
      resultIndex={resultTab.indexInResultSet}
      presentationId={presentationId}
      valuePresentationId={valuePresentationId}
      onPresentationChange={setPresentation}
      onValuePresentationChange={setValuePresentation}
    />,
  );
});
