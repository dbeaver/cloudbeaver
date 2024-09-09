/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, Container, Form, getComputed, s, StatusMessage, useForm, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { getFirstException } from '@cloudbeaver/core-utils';

import { TabList } from '../../Tabs/TabList';
import { TabPanelList } from '../../Tabs/TabPanelList';
import { TabsState } from '../../Tabs/TabsState';
import { FormMode } from '../FormMode';
import style from './BaseForm.module.css';
import type { IBaseFormProps } from './IBaseFormProps';

export const BaseForm = observer<IBaseFormProps<any>>(function BaseForm({ service, state, onClose, onSubmit }) {
  const styles = useS(style);
  const translate = useTranslate();

  const editing = state.mode === FormMode.Edit;

  const form = useForm({
    async onSubmit() {
      const mode = state.mode;
      const success = await state.save();

      onSubmit?.({
        success,
        creating: mode === FormMode.Create,
      });
    },
  });

  return (
    <Form context={form} disabled={state.isDisabled} contents focusFirstChild>
      <TabsState container={service.parts} localState={state.parts} formState={state}>
        <Container compact parent noWrap vertical>
          <Container className={s(styles, { bar: true })} gap keepSize noWrap>
            <Container fill>
              <StatusMessage exception={getFirstException(state.exception)} type={state.statusType} message={state.statusMessage} />
              <TabList className={s(styles, { tabList: true })} underline big />
            </Container>
            <Container keepSize noWrap center gap compact>
              {onClose && (
                <Button type="button" disabled={state.isDisabled} mod={['outlined']} onClick={onClose}>
                  {translate('ui_processing_cancel')}
                </Button>
              )}
              <Button type="button" disabled={!state.isChanged || state.isDisabled} mod={['unelevated']} onClick={() => form.submit()}>
                {translate(!editing ? 'ui_processing_create' : 'ui_processing_save')}
              </Button>
            </Container>
          </Container>
          <Container vertical overflow>
            <TabPanelList contents />
          </Container>
        </Container>
      </TabsState>
    </Form>
  );
});
