/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import type { TeamInfo } from '@cloudbeaver/core-authentication';
import {
  Form,
  IconOrImage,
  Loader,
  Placeholder,
  s,
  SContext,
  useExecutor,
  useForm,
  useObjectRef,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { TabBigUnderlineStyleRegistry, TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';

import { teamContext } from './Contexts/teamContext';
import type { ITeamFormState } from './ITeamFormProps';
import style from './TeamForm.m.css';
import { ITeamFormActionsContext, TeamFormActionsContext } from './TeamFormActionsContext';
import { TeamFormService } from './TeamFormService';

interface Props {
  state: ITeamFormState;
  onCancel?: () => void;
  onSave?: (team: TeamInfo) => void;
  className?: string;
}

export const TeamForm = observer<Props>(function TeamForm({ state, onCancel, onSave = () => {}, className }) {
  const translate = useTranslate();
  const props = useObjectRef({ onSave });
  const styles = useS(style);
  const service = useService(TeamFormService);
  const form = useForm({
    onSubmit: state.save,
  });
  const actions = useObjectRef<ITeamFormActionsContext>({
    save: async () => form.submit(),
  });

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

  return (
    <Form className={s(styles, { form: true })} context={form}>
      <TabsState container={service.tabsContainer} localState={state.partsState} state={state} onCancel={onCancel}>
        <div className={s(styles, { box: true }, className)}>
          <div className={s(styles, { topBar: true })}>
            <div className={s(styles, { topBarTabs: true })}>
              <div className={s(styles, { statusMessage: true })}>
                {state.statusMessage && (
                  <>
                    <IconOrImage className={s(styles, { iconOrImage: true })} icon="/icons/info_icon.svg" />
                    {translate(state.statusMessage)}
                  </>
                )}
              </div>
              <SContext registry={TabBigUnderlineStyleRegistry}>
                <TabList className={s(styles, { tabList: true })} disabled={false} />
              </SContext>
            </div>
            <div className={s(styles, { topBarActions: true })}>
              <Loader suspense inline hideMessage hideException>
                <TeamFormActionsContext.Provider value={actions}>
                  <Placeholder container={service.actionsContainer} state={state} onCancel={onCancel} />
                </TeamFormActionsContext.Provider>
              </Loader>
            </div>
          </div>
          <div className={s(styles, { content: true })}>
            <TabPanelList />
          </div>
        </div>
      </TabsState>
    </Form>
  );
});
