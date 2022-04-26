/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import {
  splitStyles, Split, ResizerControls, Pane, ErrorBoundary, useMapResource, useSplitUserState
} from '@cloudbeaver/core-blocks';
import { ConnectionExecutionContextResource, ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { NavigationTree } from '../NavigationTree';
import { WorkspacePanel } from '../shared/WorkspacePanel/WorkspacePanel';
import { WorkspacePanelService } from '../shared/WorkspacePanel/WorkspacePanelService';
import { RightArea } from './RightArea';

const mainStyles = css`
    space {
      composes: theme-typography--body2 theme-background-primary from global;
    }
    Pane {
      composes: theme-background-surface theme-text-on-surface from global;
      display: flex;
    }
    Pane:first-child {
      position: relative;
    }
    Pane:last-child {
      overflow: hidden;
    }
  `;

export const Main = observer(function Main() {
  const workspacePanelService = useService(WorkspacePanelService);

  const styles = useStyles(mainStyles, splitStyles);
  const splitState = useSplitUserState('main');
  useMapResource(
    Main,
    ConnectionExecutionContextResource,
    CachedMapAllKey
  );
  useMapResource(Main, ConnectionInfoResource, CachedMapAllKey);

  const activeWorkspaces = workspacePanelService.tabsContainer.getDisplayed();

  return styled(styles)(
    <space as="main">
      <Split {...splitState} sticky={30}>
        <Pane main>
          <ErrorBoundary remount>
            <NavigationTree />
          </ErrorBoundary>
        </Pane>
        <ResizerControls />
        <Pane>
          <Split>
            <Pane>
              <RightArea />
            </Pane>
            {activeWorkspaces.length > 0 && (
              <>
                <ResizerControls />
                <Pane main>
                  <ErrorBoundary remount>
                    <WorkspacePanel container={workspacePanelService.tabsContainer} />
                  </ErrorBoundary>
                </Pane>
              </>
            )}
          </Split>
        </Pane>
      </Split>
    </space>
  );
});
