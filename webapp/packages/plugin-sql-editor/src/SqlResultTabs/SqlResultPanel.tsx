/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import type { ITab } from '@cloudbeaver/core-app';
import { useObjectRef } from '@cloudbeaver/core-blocks';
import { TableViewer } from '@cloudbeaver/plugin-data-viewer';

import type { IResultDataTab, ISqlEditorTabState } from '../ISqlEditorTabState';

const style = css`
  result-panel {
    display: flex;
    flex: 1;
  }
`;

interface ISQLResultPanelState {
  presentationId: string;
  lastPresentationId: string;
  valuePresentationId: string | null;
  setPresentation: (id: string) => void;
  setValuePresentation: (id: string | null) => void;
}

interface SqlResultPanelProps {
  tab: ITab<ISqlEditorTabState>;
  panelInit: IResultDataTab;
}

export const SqlResultPanel = observer(function SqlResultPanel({ tab, panelInit }: SqlResultPanelProps) {
  const state = useObjectRef<ISQLResultPanelState>({
    presentationId: '',
    lastPresentationId: '',
    valuePresentationId: null,

    setPresentation(id: string) {
      this.presentationId = id;
    },

    setValuePresentation(id: string | null) {
      this.valuePresentationId = id;
    },
  }, {}, {
    presentationId: observable,
    valuePresentationId: observable,
  }, ['setValuePresentation', 'valuePresentationId']);

  const group = tab.handlerState.queryTabGroups.find(group => group.groupId === panelInit.groupId)!;

  return styled(style)(
    <result-panel as="div">
      <TableViewer
        tableId={group.modelId}
        resultIndex={panelInit.indexInResultSet}
        presentationId={state.presentationId}
        valuePresentationId={state.valuePresentationId}
        onPresentationChange={state.setPresentation}
        onValuePresentationChange={state.setValuePresentation}
      />
    </result-panel>
  );
});
