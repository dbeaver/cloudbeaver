/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect } from 'react';

import { Pane, ResizerControls, s, Split, TextPlaceholder, useS, useSplitUserState, useTranslate } from '@cloudbeaver/core-blocks';

import style from './LogViewer.module.css';
import { LogViewerInfoPanel } from './LogViewerInfoPanel.js';
import { LogViewerTable } from './LogViewerTable.js';
import { useLogViewer } from './useLogViewer.js';

export const LogViewer = observer(function LogViewer() {
  const styles = useS(style);
  const translate = useTranslate();
  const logViewerState = useLogViewer();
  const splitState = useSplitUserState('log-viewer');

  const closeInfoPanel = useCallback(() => {
    logViewerState.selectItem(null);
  }, [logViewerState]);

  useEffect(() => {
    logViewerState.update();
  }, []);

  if (!logViewerState.isActive) {
    return <TextPlaceholder>{translate('plugin_log_viewer_placeholder')}</TextPlaceholder>;
  }

  return (
    <div className={s(styles, { logViewWrapper: true })}>
      <Split {...splitState} mode={logViewerState.selectedItem ? splitState.mode : 'minimize'} disable={!logViewerState.selectedItem} keepRatio>
        <Pane className={s(styles, { pane: true })}>
          <LogViewerTable
            items={logViewerState.logItems}
            selectedItem={logViewerState.selectedItem}
            onItemSelect={logViewerState.selectItem}
            onClear={() => logViewerState.clearLog()}
          />
        </Pane>
        <ResizerControls />
        <Pane className={s(styles, { pane: true })} basis="40%" main>
          {logViewerState.selectedItem && <LogViewerInfoPanel selectedItem={logViewerState.selectedItem} onClose={closeInfoPanel} />}
        </Pane>
      </Split>
    </div>
  );
});
