/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, Container, Form, s, StatusMessage, useAutoLoad, useForm, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import {
  BASE_TAB_STYLES,
  FormMode,
  IFormState,
  TabList,
  TabPanelList,
  TabsState,
  UNDERLINE_TAB_BIG_STYLES,
  UNDERLINE_TAB_STYLES,
} from '@cloudbeaver/core-ui';
import { getFirstException } from '@cloudbeaver/core-utils';

import style from './AdministrationUserForm.m.css';
import { AdministrationUserFormService, IUserFormState } from './AdministrationUserFormService';
import { DATA_CONTEXT_USER_FORM_INFO_PART } from './Info/DATA_CONTEXT_USER_FORM_INFO_PART';

interface Props {
  state: IFormState<IUserFormState>;
  onClose: () => void;
}

const deprecatedStyle = [BASE_TAB_STYLES, UNDERLINE_TAB_STYLES, UNDERLINE_TAB_BIG_STYLES];
export const AdministrationUserForm = observer<Props>(function AdministrationUserForm({ state, onClose }) {
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
        const userFormInfoPart = state.dataContext.get(DATA_CONTEXT_USER_FORM_INFO_PART);

        if (mode === FormMode.Create) {
          notificationService.logSuccess({ title: 'authentication_administration_user_created', message: userFormInfoPart.state.userId });
        } else {
          notificationService.logSuccess({ title: 'authentication_administration_user_updated', message: userFormInfoPart.state.userId });
        }

        onClose();
      }
    },
  });

  useAutoLoad(AdministrationUserForm, state);

  return (
    <Form context={form} className={s(styles, { submittingForm: true })} disabled={state.isDisabled} focusFirstChild>
      <TabsState container={administrationUserFormService.parts} localState={state.parts} formState={state}>
        <Container compact parent noWrap vertical>
          <Container className={s(styles, { bar: true })} gap keepSize noWrap>
            <Container fill>
              <StatusMessage exception={getFirstException(state.exception)} type={state.statusType} message={state.statusMessage} />
              <TabList className={s(styles, { tabList: true })} style={deprecatedStyle} />
            </Container>
            <Container keepSize noWrap center gap compact>
              <Button type="button" disabled={state.isDisabled} mod={['outlined']} onClick={onClose}>
                {translate('ui_processing_cancel')}
              </Button>
              <Button type="button" disabled={state.isDisabled} mod={['unelevated']} onClick={() => form.submit()}>
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
