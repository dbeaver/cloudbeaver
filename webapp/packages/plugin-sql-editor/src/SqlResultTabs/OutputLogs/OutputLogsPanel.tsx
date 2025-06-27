/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Group, useResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EditorLoader } from '@cloudbeaver/plugin-codemirror6';

import type { ISqlEditorTabState } from '../../ISqlEditorTabState.js';
import { OutputLogsResource } from './OutputLogsResource.js';
import { OutputLogsService } from './OutputLogsService.js';
import { OutputLogsToolbar } from './OutputLogsToolbar.js';
import { useOutputLogsPanelState } from './useOutputLogsPanelState.js';

interface Props {
  sqlEditorTabState: ISqlEditorTabState;
}

export const OutputLogsPanel = observer<Props>(function SqlOutputLogsPanel({ sqlEditorTabState }) {
  const outputLogsService = useService(OutputLogsService);
  const { data } = useResource(SqlOutputLogsPanel, OutputLogsResource, undefined);
  const outputLogs = outputLogsService.getOutputLogs(data, sqlEditorTabState);

  const state = useOutputLogsPanelState(outputLogs, sqlEditorTabState);

  return (
    <Container className="theme-background-secondary" overflow vertical noWrap dense parent gap>
      <OutputLogsToolbar state={state} sqlEditorTabState={sqlEditorTabState} />
      <Group box overflow>
        <EditorLoader
          value={state.resultValue}
          foldGutter={false}
          lineWrapping={outputLogsService.settings.wrapMode}
          highlightActiveLine={false}
          readonly
        />
      </Group>
    </Container>
  );
});
