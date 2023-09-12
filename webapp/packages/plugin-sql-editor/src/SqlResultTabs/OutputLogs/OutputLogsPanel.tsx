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

  const editorExtensions = useCodemirrorExtensions(undefined, [highlightSelectionMatches()]);

  return (
    <div className={s(styles, { container: true })}>
      <OutputLogsToolbar state={state} />
      <div className={s(styles, { editorContainer: true })}>
        {data && <EditorLoader value={state.resultValue} useDefaultExtensions={false} extensions={editorExtensions} readonly />}
      </div>
    </div>
  );
});
