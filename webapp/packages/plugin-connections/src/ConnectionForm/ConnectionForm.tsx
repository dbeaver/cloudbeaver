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

import { ExceptionMessage, Form, Loader, Placeholder, StatusMessage, useExecutor, useForm, useObjectRef, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType } from '@cloudbeaver/core-events';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { BASE_TAB_STYLES, TabList, TabPanelList, TabsState, UNDERLINE_TAB_BIG_STYLES, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';

import { ConnectionFormService } from './ConnectionFormService';
import { connectionConfigContext } from './Contexts/connectionConfigContext';
import type { IConnectionFormActions, IConnectionFormState } from './IConnectionFormProps';
import connectionFormStyles from './ConnectionForm.m.css';

const tabsStyles = css`
  TabList {
    position: relative;
    flex-shrink: 0;
    align-items: center;
  }
`;

const topBarStyles = css`
  connection-top-bar {
    composes: theme-border-color-background theme-background-secondary theme-text-on-secondary from global;
  }
  connection-top-bar {
    position: relative;
    display: flex;
    padding-top: 16px;

    &:before {
      content: '';
      position: absolute;
      bottom: 0;
      width: 100%;
      border-bottom: solid 2px;
      border-color: inherit;
    }
  }
  connection-top-bar-tabs {
    flex: 1;
  }

  connection-top-bar-actions {
    display: flex;
    align-items: center;
    padding: 0 24px;
    gap: 16px;
  }

  /*Button:not(:first-child) {
      margin-right: 24px;
    }*/

  connection-status-message {
    composes: theme-typography--caption from global;
    height: 24px;
    padding: 0 16px;
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

export interface ConnectionFormProps {
  state: IConnectionFormState;
  onCancel?: () => void;
  onSave?: (config: ConnectionConfig) => void;
  className?: string;
}

export const ConnectionForm = observer<ConnectionFormProps>(function ConnectionForm({ state, onCancel, onSave = () => {}, className }) {
  const props = useObjectRef({ onSave });
  const style = [BASE_TAB_STYLES, tabsStyles, UNDERLINE_TAB_STYLES, UNDERLINE_TAB_BIG_STYLES];
  const styles = useStyles(style, topBarStyles, formStyles);
  const service = useService(ConnectionFormService);
  
  const form = useForm({
    onSubmit: event => {
      if (event?.type === 'test') {
        state.test();
      } else {
        state.save();
      }
    },
  });

  const actionsContext = useObjectRef<IConnectionFormActions>(() => ({
    save: () => {
      form.submit(new SubmitEvent('submit'));
    },
    test: () => {
      form.submit(new SubmitEvent('test'));
    },
  }));

  useExecutor({
    executor: state.submittingTask,
    postHandlers: [
      function save(data, contexts) {
        const validation = contexts.getContext(service.connectionValidationContext);
        const state = contexts.getContext(service.connectionStatusContext);
        const config = contexts.getContext(connectionConfigContext);

        if (validation.valid && state.saved && data.submitType === 'submit') {
          props.onSave(config);
        }
      },
    ],
  });

  useEffect(() => {
    state.loadConnectionInfo();
  }, [state]);

  if (state.initError) {
    return styled(styles)(<ExceptionMessage exception={state.initError} onRetry={() => state.loadConnectionInfo()} />);
  }

  if (!state.configured) {
    return styled(styles)(
      <box className={className}>
        <Loader />
      </box>,
    );
  }

  return styled(styles)(
    <Form context={form} className={connectionFormStyles.form}>
      <TabsState actions={actionsContext} container={service.tabsContainer} localState={state.partsState} state={state} onCancel={onCancel}>
        <box className={className}>
          <connection-top-bar>
            <connection-top-bar-tabs>
              <connection-status-message>
                <StatusMessage type={ENotificationType.Info} message={state.statusMessage} />
              </connection-status-message>
              <TabList style={style} disabled={state.disabled} />
            </connection-top-bar-tabs>
            <connection-top-bar-actions>
              <Loader suspense inline hideMessage hideException>
                <Placeholder actions={actionsContext} container={service.actionsContainer} state={state} onCancel={onCancel} />
              </Loader>
            </connection-top-bar-actions>
          </connection-top-bar>
          <content-box>
            <TabPanelList style={style} />
          </content-box>
        </box>
      </TabsState>
    </Form>,
  );
});
