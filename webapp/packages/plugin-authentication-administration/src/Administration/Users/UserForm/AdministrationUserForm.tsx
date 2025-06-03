/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, Container, Form, s, StatusMessage, useAutoLoad, useForm, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { FormMode, type IFormState, TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';
import { getFirstException } from '@cloudbeaver/core-utils';

import style from './AdministrationUserForm.module.css';
import { AdministrationUserFormDeleteButton } from './AdministrationUserFormDeleteButton.js';
import { AdministrationUserFormService, type IUserFormState } from './AdministrationUserFormService.js';
import { getUserFormInfoPart } from './Info/getUserFormInfoPart.js';

interface Props {
  state: IFormState<IUserFormState>;
  onClose: () => void;
}

export const AdministrationUserForm = observer<Props>(function AdministrationUserForm({ state, onClose }) {
  const userFormInfoPart = getUserFormInfoPart(state);
  const styles = useS(style);
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const administrationUserFormService = useService(AdministrationUserFormService);

  const editing = state.mode === FormMode.Edit;

  const form = useForm({
    async onSubmit() {
      const mode = state.mode;
      const saved = await state.save();

      if (saved) {
        if (mode === FormMode.Create) {
          onClose();
          notificationService.logSuccess({ title: 'authentication_administration_user_created', message: userFormInfoPart.state.userId });
        } else {
          notificationService.logSuccess({ title: 'authentication_administration_user_updated', message: userFormInfoPart.state.userId });
        }
      } else {
        if (state.mode === FormMode.Create) {
          // user not created
          notificationService.logError({ title: 'authentication_administration_user_create_failed' });
        } else {
          // user created but not all data saved correctly
          if (mode === FormMode.Create) {
            notificationService.logSuccess({ title: 'authentication_administration_user_created', message: userFormInfoPart.state.userId });
          }
          notificationService.logError({ title: 'authentication_administration_user_update_failed' });
        }
      }
    },
  });

  useAutoLoad(AdministrationUserForm, [userFormInfoPart]);

  return (
    <Form context={form} disabled={state.isDisabled} contents focusFirstChild>
      <TabsState container={administrationUserFormService.parts} localState={state.parts} formState={state}>
        <Container noWrap vertical>
          <Container className={s(styles, { header: true })} gap keepSize noWrap>
            <Container fill>
              <StatusMessage
                className={s(styles, { statusMessage: true })}
                exception={getFirstException(userFormInfoPart.exception)}
                type={state.statusType}
                message={state.statusMessage}
              />
              <TabList underline big />
            </Container>
            <Container keepSize noWrap center gap compact>
              {editing && (
                <AdministrationUserFormDeleteButton
                  userId={userFormInfoPart.initialState.userId}
                  enabled={userFormInfoPart.initialState.enabled}
                  disableUser={userFormInfoPart.disableUser}
                />
              )}
              <Button type="button" disabled={state.isDisabled} variant="secondary" onClick={onClose}>
                {translate('ui_processing_cancel')}
              </Button>
              <Button type="button" disabled={state.isDisabled} onClick={() => form.submit()}>
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
