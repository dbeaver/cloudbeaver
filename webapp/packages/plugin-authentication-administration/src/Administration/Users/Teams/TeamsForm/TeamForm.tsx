/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, Container, Form, s, StatusMessage, useForm, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';
import { getFirstException } from '@cloudbeaver/core-utils';

import style from './TeamForm.module.css';
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
  const translate = useTranslate();
  const editing = state.mode === 'edit';
  const form = useForm({
    onSubmit: async function onSubmit() {
      const initialMode = state.mode;
      const title = state.mode === 'create' ? 'administration_teams_team_info_created' : 'administration_teams_team_info_updated';

      const saved = await state.save();
      const exception = getFirstException(state.exception);

      if (saved) {
        const message = state.state.teamId ?? '';

        notificationService.logSuccess({ title, message });

        onSave?.();
        onCancel?.();
      } else {
        if (exception) {
          const errorKey = state.mode === 'create' ? 'administration_teams_team_create_error' : 'administration_teams_team_save_error';
          notificationService.logException(exception, errorKey);
        }

        // team created but other parts failed
        if (initialMode === 'create' && state.mode === 'edit') {
          notificationService.logSuccess({ title: 'administration_teams_team_info_created', message: state.state?.teamId ?? '' });
        }
      }
    },
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
              <Button type="button" disabled={state.isDisabled} variant="secondary" onClick={onCancel}>
                {translate('ui_processing_cancel')}
              </Button>
              <Button type="button" disabled={state.isDisabled || !state.isChanged} onClick={() => form.submit()}>
                {translate(!editing ? 'ui_processing_create' : 'ui_processing_save')}
              </Button>
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
