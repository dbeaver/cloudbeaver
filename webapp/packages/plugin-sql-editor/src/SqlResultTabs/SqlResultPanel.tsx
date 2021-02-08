/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css } from 'reshadow';

import type { ITab } from '@cloudbeaver/core-app';
import { TableViewer } from '@cloudbeaver/plugin-data-viewer';

import type { IResultDataTab, ISqlEditorTabState } from '../ISqlEditorTabState';

const style = css`
  result-panel {
    display: flex;
    flex: 1;
  }
`;

interface SqlResultPanelProps {
  tab: ITab<ISqlEditorTabState>;
  panelInit: IResultDataTab;
}

export const SqlResultPanel = observer(function SqlResultPanel({ tab, panelInit }: SqlResultPanelProps) {
  const [presentationId, setPresentation] = useState('');
  const group = tab.handlerState.queryTabGroups.find(group => group.groupId === panelInit.groupId)!;

  return styled(style)(
    <result-panel as="div">
      <TableViewer
        tableId={group.modelId}
        resultIndex={panelInit.indexInResultSet}
        presentationId={presentationId}
        onPresentationChange={setPresentation}
      />
    </result-panel>
  );
});
