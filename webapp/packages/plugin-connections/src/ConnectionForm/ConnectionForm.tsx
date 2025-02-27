/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ExceptionMessage, Form, Loader, Placeholder, s, StatusMessage, useExecutor, useForm, useObjectRef, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType } from '@cloudbeaver/core-events';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { formStatusContext, formValidationContext, TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';

import { ConnectionFormActionsContext, type IConnectionFormActionsContext } from './ConnectFormActionsContext.js';
import style from './ConnectionForm.module.css';
import { connectionConfigContext } from './Contexts/connectionConfigContext.js';
import type { ConnectionFormStateRefactored } from './ConnectionFormStateRefactored.js';
import { getFirstException } from '@cloudbeaver/core-utils';
import { ConnectionFormServiceRefactored } from './ConnectionFormServiceRefactored.js';

export interface ConnectionFormProps {
  state: ConnectionFormStateRefactored;
  onCancel?: () => void;
  onSave?: (config: ConnectionConfig) => void;
  className?: string;
}

export const ConnectionForm = observer<ConnectionFormProps>(function ConnectionForm({ state, onCancel, onSave = () => {}, className }) {
  const props = useObjectRef({ onSave });
  const service = useService(ConnectionFormServiceRefactored);
  const styles = useS(style);

  const form = useForm({
    onSubmit: event => {
      if (event?.type === 'test') {
        state.setState({
          ...state.state,
          submitType: 'test',
        });
      } else {
        state.setState({
          ...state.state,
          submitType: 'submit',
        });
      }
    },
  });

  const actionsContext = useObjectRef<IConnectionFormActionsContext>(() => ({
    save: async () => form.submit(new SubmitEvent('submit')),
    test: async () => form.submit(new SubmitEvent('test')),
  }));

  useExecutor({
    executor: state.submitTask,
    postHandlers: [
      function save(data, contexts) {
        const validation = contexts.getContext(formValidationContext);
        const state = contexts.getContext(formStatusContext);
        const config = contexts.getContext(connectionConfigContext);

        if (validation.valid && state.saved && data.state.submitType === 'submit') {
          props.onSave(config);
        }
      },
    ],
  });

  if (getFirstException(state.exception)) {
    return <ExceptionMessage exception={getFirstException(state.exception)} />;
  }

  // should we delete it?
  // if (!state.configured) {
  //   return (
  //     <div className={s(styles, { box: true }, className)}>
  //       <Loader />
  //     </div>
  //   );
  // }

  return (
    <Form context={form} contents>
      <TabsState container={service.parts} localState={state.parts} formState={state}>
        <div className={s(styles, { box: true }, className)}>
          <div className={s(styles, { connectionTopBar: true })}>
            <div className={s(styles, { connectionTopBarTabs: true })}>
              <div className={s(styles, { connectionStatusMessage: true })}>
                <StatusMessage type={ENotificationType.Info} message={state.statusMessage} />
              </div>
              <TabList className={s(styles, { tabList: true })} disabled={state.isDisabled} underline big />
            </div>
            <div className={s(styles, { connectionTopBarActions: true })}>
              <Loader suspense inline hideMessage hideException>
                <ConnectionFormActionsContext.Provider value={actionsContext}>
                  <Placeholder container={service.actionsContainer} formState={state} />
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
