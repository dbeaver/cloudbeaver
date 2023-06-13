/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import type { TeamInfo } from '@cloudbeaver/core-authentication';
import {
  BASE_CONTAINERS_STYLES,
  IconOrImage,
  Loader,
  Placeholder,
  useExecutor,
  useObjectRef,
  useStyles,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { BASE_TAB_STYLES, TabList, TabPanelList, TabsState, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';

import { teamContext } from './Contexts/teamContext';
import type { ITeamFormState } from './ITeamFormProps';
import { TeamFormService } from './TeamFormService';

const tabsStyles = css`
  TabList {
    position: relative;
    flex-shrink: 0;
    align-items: center;
  }
`;

const topBarStyles = css`
  team-top-bar {
    composes: theme-border-color-background theme-background-secondary theme-text-on-secondary from global;
    position: relative;
    display: flex;
    padding-top: 8px;

    &:before {
      content: '';
      position: absolute;
      bottom: 0;
      width: 100%;
      border-bottom: solid 2px;
      border-color: inherit;
    }
  }
  team-top-bar-tabs {
    flex: 1;
  }

  team-top-bar-actions {
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 16px;
  }

  team-status-message {
    composes: theme-typography--caption from global;
    height: 24px;
    padding: 0 8px;
    display: flex;
    align-items: center;
    gap: 8px;

    & IconOrImage {
      height: 24px;
      width: 24px;
    }
  }
`;

const formStyles = css`
  box {
    composes: theme-background-secondary theme-text-on-secondary from global;
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    overflow: auto;
  }
  content-box {
    composes: theme-background-secondary theme-border-color-background from global;
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: auto;
  }
`;

interface Props {
  state: ITeamFormState;
  onCancel?: () => void;
  onSave?: (team: TeamInfo) => void;
  className?: string;
}

export const TeamForm = observer<Props>(function TeamForm({ state, onCancel, onSave = () => {}, className }) {
  const translate = useTranslate();
  const props = useObjectRef({ onSave });
  const style = [BASE_TAB_STYLES, tabsStyles, UNDERLINE_TAB_STYLES];
  const styles = useStyles(style, BASE_CONTAINERS_STYLES, topBarStyles, formStyles);
  const service = useService(TeamFormService);

  useExecutor({
    executor: state.submittingTask,
    postHandlers: [
      function save(data, contexts) {
        const validation = contexts.getContext(service.configurationValidationContext);
        const state = contexts.getContext(service.configurationStatusContext);
        const config = contexts.getContext(teamContext);

        if (validation.valid && state.saved) {
          props.onSave(config);
        }
      },
    ],
  });

  useEffect(() => {
    state.loadTeamInfo();
  }, []);

  return styled(styles)(
    <TabsState container={service.tabsContainer} localState={state.partsState} state={state} onCancel={onCancel}>
      <box className={className}>
        <team-top-bar>
          <team-top-bar-tabs>
            <team-status-message>
              {state.statusMessage && (
                <>
                  <IconOrImage icon="/icons/info_icon.svg" />
                  {translate(state.statusMessage)}
                </>
              )}
            </team-status-message>
            <TabList style={style} disabled={false} />
          </team-top-bar-tabs>
          <team-top-bar-actions>
            <Loader suspense inline hideMessage hideException>
              <Placeholder container={service.actionsContainer} state={state} onCancel={onCancel} />
            </Loader>
          </team-top-bar-actions>
        </team-top-bar>
        <content-box>
          <TabPanelList style={style} />
        </content-box>
      </box>
    </TabsState>,
  );
});
