/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Group, s, useResource, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EditorLoader } from '@cloudbeaver/plugin-codemirror6';

import type { ISqlEditorTabState } from '../../ISqlEditorTabState';
import { OutputLogsResource } from './OutputLogsResource';
import { OutputLogsService } from './OutputLogsService';
import { OutputLogsToolbar } from './OutputLogsToolbar';
import { useOutputLogsPanelState } from './useOutputLogsPanelState';

interface Props {
  sqlEditorTabState: ISqlEditorTabState;
}

export const OutputLogsPanel = observer<Props>(function SqlOutputLogsPanel({ sqlEditorTabState }) {
  const outputLogsService = useService(OutputLogsService);
  const { data } = useResource(SqlOutputLogsPanel, OutputLogsResource, undefined);
  const outputLogs = outputLogsService.getOutputLogs(data, sqlEditorTabState);

  const state = useOutputLogsPanelState(outputLogs, sqlEditorTabState);

  return (
    <Container className="theme-background-secondary" parent vertical gap dense>
      <OutputLogsToolbar state={state} sqlEditorTabState={sqlEditorTabState}/>
      <Group overflow box>
        {data && <EditorLoader value={state.resultValue} foldGutter={false} highlightActiveLine={false} lineWrapping readonly />}
      </Group>
    </Container>
  );
});
