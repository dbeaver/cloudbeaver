/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { Pane, ResizerControls, Split, splitStyles, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { LogViewerInfoPanel } from './LogViewerInfoPanel';
import { LogViewerTable } from './LogViewerTable';
import { useLogViewer } from './useLogViewer';

const styles = composes(
  css`
    Pane {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    log-view-wrapper, Pane {
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: hidden;
    }
`);

export const LogViewer = observer(function LogViewer() {
  const style = useStyles(styles, splitStyles);
  const translate = useTranslate();
  const logViewerState = useLogViewer();

  const closeInfoPanel = useCallback(() => {
    logViewerState.selectItem(null);
  }, [logViewerState]);

  if (!logViewerState.isActive) {
    return <TextPlaceholder>{translate('app_shared_toolsMenu_logViewer_placeholder')}</TextPlaceholder>;
  }

  return styled(style)(
    <log-view-wrapper>
      <Split mode={logViewerState.selectedItem ? undefined : 'maximize'} keepRatio>
        <Pane main>
          <LogViewerTable
            items={logViewerState.logItems}
            selectedItem={logViewerState.selectedItem}
            onItemSelect={logViewerState.selectItem}
            onClear={() => logViewerState.clearLog()}
          />
        </Pane>
        {logViewerState.selectedItem && (
          <>
            <ResizerControls />
            <Pane>
              <LogViewerInfoPanel
                selectedItem={logViewerState.selectedItem}
                onClose={closeInfoPanel}
              />
            </Pane>
          </>
        )}
      </Split>
    </log-view-wrapper>
  );
});
