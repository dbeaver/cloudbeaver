/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { Pane, ResizerControls, Split, splitStyles, TextPlaceholder, useSplitUserState, useStyles, useTranslate } from '@cloudbeaver/core-blocks';

import { LogViewerInfoPanel } from './LogViewerInfoPanel';
import { LogViewerTable } from './LogViewerTable';
import { useLogViewer } from './useLogViewer';

const styles = css`
    Pane {
      composes: theme-background-surface theme-text-on-surface from global;
    }
    log-view-wrapper, Pane {
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: hidden;
    }
`;

export const LogViewer = observer(function LogViewer() {
  const style = useStyles(styles, splitStyles);
  const translate = useTranslate();
  const logViewerState = useLogViewer();
  const splitState = useSplitUserState('log-viewer');

  const closeInfoPanel = useCallback(() => {
    logViewerState.selectItem(null);
  }, [logViewerState]);

  if (!logViewerState.isActive) {
    return <TextPlaceholder>{translate('plugin_log_viewer_placeholder')}</TextPlaceholder>;
  }

  return styled(style)(
    <log-view-wrapper>
      <Split
        {...splitState}
        mode={logViewerState.selectedItem ? splitState.mode : 'minimize'}
        disable={!logViewerState.selectedItem}
        keepRatio
      >
        <Pane>
          <LogViewerTable
            items={logViewerState.logItems}
            selectedItem={logViewerState.selectedItem}
            onItemSelect={logViewerState.selectItem}
            onClear={() => logViewerState.clearLog()}
          />
        </Pane>
        <ResizerControls />
        <Pane basis='40%' main>
          {logViewerState.selectedItem && (
            <LogViewerInfoPanel
              selectedItem={logViewerState.selectedItem}
              onClose={closeInfoPanel}
            />
          )}
        </Pane>
      </Split>
    </log-view-wrapper>
  );
});
