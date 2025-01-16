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
  Container,
  Form,
  Loader,
  Placeholder,
  s,
  StatusMessage,
  useExecutor,
  useForm,
  useObjectRef,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType } from '@cloudbeaver/core-events';
import { TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';

import { teamContext } from './Contexts/teamContext.js';
import type { ITeamFormState } from './ITeamFormProps.js';
import style from './TeamForm.module.css';
import { type ITeamFormActionsContext, TeamFormActionsContext } from './TeamFormActionsContext.js';
import { TeamFormService } from './TeamFormService.js';

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
    <Form context={form} contents>
      <TabsState container={service.tabsContainer} localState={state.partsState} state={state} onCancel={onCancel}>
        <Container noWrap vertical>
          <Container className={s(styles, { topBar: true })} gap keepSize noWrap>
            <Container fill>
              <StatusMessage message={translate(state.statusMessage || undefined)} type={ENotificationType.Info} />
              <TabList disabled={false} underline big />
            </Container>
            <Container keepSize noWrap center gap compact>
              <Loader suspense inline hideMessage hideException>
                <TeamFormActionsContext.Provider value={actions}>
                  <Placeholder container={service.actionsContainer} state={state} onCancel={onCancel} />
                </TeamFormActionsContext.Provider>
              </Loader>
            </Container>
          </Container>
          <Container vertical>
            <TabPanelList />
          </Container>
        </Container>
      </TabsState>
    </Form>
  );
});
