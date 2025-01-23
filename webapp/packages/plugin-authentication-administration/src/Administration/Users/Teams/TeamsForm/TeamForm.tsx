/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Form, Loader, Placeholder, s, StatusMessage, useForm, useObjectRef, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';
import { getFirstException } from '@cloudbeaver/core-utils';

import style from './TeamForm.module.css';
import { type ITeamFormActionsContext, TeamFormActionsContext } from './TeamFormActionsContext.js';
import { TeamsAdministrationFormService } from './TeamsAdministrationFormService.js';
import type { TeamsAdministrationFormState } from './TeamsAdministrationFormState.js';

interface Props {
  state: TeamsAdministrationFormState;
  onCancel?: () => void;
  onSave?: VoidFunction;
  className?: string;
}

export const TeamForm = observer<Props>(function TeamForm({ state, onCancel, onSave = () => {}, className }) {
  const styles = useS(style);
  const service = useService(TeamsAdministrationFormService);
  const notificationService = useService(NotificationService);
  const form = useForm({
    onSubmit: async function onSubmit() {
      const title = state.mode === 'create' ? 'administration_teams_team_info_created' : 'administration_teams_team_info_updated';
      const errorKey = state.mode === 'create' ? 'administration_teams_team_create_error' : 'administration_teams_team_save_error';

      const saved = await state.save();

      if (saved) {
        const message = state.state.teamId ?? '';

        notificationService.logSuccess({ title, message });

        onSave?.();
        onCancel?.();
      } else {
        notificationService.logException(getFirstException(state.exception), errorKey);
      }
    },
  });
  const actions = useObjectRef<ITeamFormActionsContext>({
    save: async () => form.submit(),
    onCancel: () => onCancel?.(),
  });

  return (
    <Form context={form} contents>
      <TabsState container={service.parts} formState={state}>
        <Container noWrap vertical>
          <Container className={s(styles, { topBar: true })} gap keepSize noWrap>
            <Container fill>
              <StatusMessage exception={getFirstException(state.exception)} message={state.statusMessage} type={ENotificationType.Info} />
              <TabList disabled={false} underline big />
            </Container>
            <Container keepSize noWrap center gap compact>
              <Loader suspense inline hideMessage hideException>
                <TeamFormActionsContext.Provider value={actions}>
                  <Placeholder container={service.actionsContainer} formState={state} />
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
