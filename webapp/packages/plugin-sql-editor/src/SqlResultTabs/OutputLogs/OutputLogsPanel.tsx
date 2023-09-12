/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { highlightSelectionMatches } from '@codemirror/search';
import { observer } from 'mobx-react-lite';

import { s, useResource, useS } from '@cloudbeaver/core-blocks';
import { EditorLoader, useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';

import type { IOutputLogsTab } from '../../ISqlEditorTabState';
import style from './OutputLogsPanel.m.css';
import { OutputLogsResource } from './OutputLogsResource';
import { OutputLogsToolbar } from './OutputLogsToolbar';
import { useOutputLogsPanelState } from './useOutputLogsPanelState';

interface Props {
  outputLogsTab: IOutputLogsTab;
}

export const OutputLogsPanel = observer<Props>(function SqlOutputLogsPanel({ outputLogsTab }) {
  const styles = useS(style);
  const { data } = useResource(SqlOutputLogsPanel, OutputLogsResource, undefined);
  const state = useOutputLogsPanelState(data);

  return (
    <div className={s(styles, { container: true })}>
      <OutputLogsToolbar state={state} />
      <div className={s(styles, { editorContainer: true })}>
        {data && <EditorLoader value={state.resultValue} foldGutter={false} highlightActiveLine={false} readonly />}
      </div>
    </div>
  );
});
