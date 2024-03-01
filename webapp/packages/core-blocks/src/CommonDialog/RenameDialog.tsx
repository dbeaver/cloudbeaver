/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { throttleAsync } from '@cloudbeaver/core-utils';

import { Button } from '../Button';
import { Container } from '../Containers/Container';
import { Fill } from '../Fill';
import { Form } from '../FormControls/Form';
import { InputField } from '../FormControls/InputField/InputField';
import { useTranslate } from '../localization/useTranslate';
import { s } from '../s';
import { useFocus } from '../useFocus';
import { useObservableRef } from '../useObservableRef';
import { useS } from '../useS';
import { CommonDialogBody } from './CommonDialog/CommonDialogBody';
import { CommonDialogFooter } from './CommonDialog/CommonDialogFooter';
import { CommonDialogHeader } from './CommonDialog/CommonDialogHeader';
import { CommonDialogWrapper } from './CommonDialog/CommonDialogWrapper';
import style from './RenameDialog.m.css';

interface IRenameDialogState {
  value: string;
  message: string | undefined;
  valid: boolean;
  payload: RenameDialogPayload;
  validate: () => void;
  setMessage: (message: string) => void;
}

export interface RenameDialogPayload {
  value: string;
  objectName?: string;
  icon?: string;
  subTitle?: string;
  bigIcon?: boolean;
  viewBox?: string;
  confirmActionText?: string;
  create?: boolean;
  title?: string;
  validation?: (name: string, setMessage: (message: string) => void) => Promise<boolean> | boolean;
}

export const RenameDialog: DialogComponent<RenameDialogPayload, string> = observer(function RenameDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const styles = useS(style);

  const { icon, subTitle, bigIcon, viewBox, value, objectName, create, confirmActionText } = payload;
  let { title } = payload;

  if (!title) {
    title = create ? 'ui_create' : 'ui_rename';
  }

  title = translate(title);

  if (objectName) {
    title += ` ${translate(objectName)}`;
  }

  const state = useObservableRef<IRenameDialogState>(
    () => ({
      value,
      message: undefined,
      valid: true,
      validate: throttleAsync(async () => {
        state.message = undefined;
        state.valid = (await state.payload.validation?.(state.value, state.setMessage.bind(state))) ?? true;
      }, 300),
      setMessage(message) {
        this.message = message;
      },
    }),
    {
      value: observable.ref,
      valid: observable.ref,
      message: observable.ref,
    },
    {
      payload,
    },
  );

  useEffect(() => {
    state.validate();
  }, [value]);

  const errorMessage = state.valid ? ' ' : translate(state.message ?? 'ui_rename_taken_or_invalid');

  return (
    <CommonDialogWrapper size="small" className={className} fixedWidth>
      <CommonDialogHeader title={title} subTitle={subTitle} icon={icon} viewBox={viewBox} bigIcon={bigIcon} onReject={rejectDialog} />
      <CommonDialogBody>
        <Form ref={focusedRef} onSubmit={() => resolveDialog(state.value)}>
          <Container center>
            <InputField name="value" state={state} error={!state.valid} description={errorMessage} onChange={() => state.validate()}>
              {translate('ui_name') + ':'}
            </InputField>
          </Container>
        </Form>
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { footer: true })}>
        <Button type="button" mod={['outlined']} onClick={rejectDialog}>
          {translate('ui_processing_cancel')}
        </Button>
        <Fill />
        <Button type="button" mod={['unelevated']} disabled={!state.valid} onClick={() => resolveDialog(state.value)}>
          {translate(confirmActionText || (create ? 'ui_create' : 'ui_rename'))}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
