/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import {
  ExceptionMessage,
  Form,
  Loader,
  Placeholder,
  s,
  SContext,
  StatusMessage,
  useExecutor,
  useForm,
  useObjectRef,
  useS,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType } from '@cloudbeaver/core-events';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { TabBigUnderlineStyleRegistry, TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';

import { ConnectionFormActionsContext, IConnectionFormActionsContext } from './ConnectFormActionsContext';
import style from './ConnectionForm.m.css';
import { ConnectionFormService } from './ConnectionFormService';
import { connectionConfigContext } from './Contexts/connectionConfigContext';
import type { IConnectionFormState } from './IConnectionFormProps';

export interface ConnectionFormProps {
  state: IConnectionFormState;
  onCancel?: () => void;
  onSave?: (config: ConnectionConfig) => void;
  className?: string;
}

export const ConnectionForm = observer<ConnectionFormProps>(function ConnectionForm({ state, onCancel, onSave = () => {}, className }) {
  const props = useObjectRef({ onSave });
  const service = useService(ConnectionFormService);
  const styles = useS(style);

  const form = useForm({
    onSubmit: event => {
      if (event?.type === 'test') {
        state.test();
      } else {
        state.save();
      }
    },
  });

  const actionsContext = useObjectRef<IConnectionFormActionsContext>(() => ({
    save: async () => form.submit(new SubmitEvent('submit')),
    test: async () => form.submit(new SubmitEvent('test')),
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
    return <ExceptionMessage exception={state.initError} onRetry={() => state.loadConnectionInfo()} />;
  }

  if (!state.configured) {
    return (
      <div className={s(styles, { box: true }, className)}>
        <Loader />
      </div>
    );
  }

  return (
    <Form context={form} contents>
      <TabsState container={service.tabsContainer} localState={state.partsState} state={state} onCancel={onCancel}>
        <div className={s(styles, { box: true }, className)}>
          <div className={s(styles, { connectionTopBar: true })}>
            <div className={s(styles, { connectionTopBarTabs: true })}>
              <div className={s(styles, { connectionStatusMessage: true })}>
                <StatusMessage type={ENotificationType.Info} message={state.statusMessage} />
              </div>
              <SContext registry={TabBigUnderlineStyleRegistry}>
                <TabList className={s(styles, { tabList: true })} disabled={state.disabled} />
              </SContext>
            </div>
            <div className={s(styles, { connectionTopBarActions: true })}>
              <Loader suspense inline hideMessage hideException>
                <ConnectionFormActionsContext.Provider value={actionsContext}>
                  <Placeholder container={service.actionsContainer} state={state} onCancel={onCancel} />
                </ConnectionFormActionsContext.Provider>
              </Loader>
            </div>
          </div>
          <div className={s(styles, { contentBox: true })}>
            <TabPanelList />
          </div>
        </div>
      </TabsState>
    </Form>
  );
});
