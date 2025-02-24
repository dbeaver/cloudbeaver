/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { throttleAsync } from '@cloudbeaver/core-utils';

import { Button } from '../Button.js';
import { Container } from '../Containers/Container.js';
import { Fill } from '../Fill.js';
import { Form } from '../FormControls/Form.js';
import { InputField } from '../FormControls/InputField/InputField.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useFocus } from '../useFocus.js';
import { useObservableRef } from '../useObservableRef.js';
import { useS } from '../useS.js';
import { CommonDialogBody } from './CommonDialog/CommonDialogBody.js';
import { CommonDialogFooter } from './CommonDialog/CommonDialogFooter.js';
import { CommonDialogHeader } from './CommonDialog/CommonDialogHeader.js';
import { CommonDialogWrapper } from './CommonDialog/CommonDialogWrapper.js';
import style from './RenameDialog.module.css';

interface IRenameDialogState {
  name: string;
  message: string | undefined;
  valid: boolean;
  payload: RenameDialogPayload;
  validate: () => Promise<void>;
  setMessage: (message: string) => void;
}

export interface RenameDialogPayload {
  name: string;
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

  const { icon, subTitle, bigIcon, viewBox, name, objectName, create, confirmActionText } = payload;
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
      name,
      message: undefined,
      valid: true,
      validate: throttleAsync(async () => {
        state.message = undefined;
        state.valid = (await state.payload.validation?.(state.name, state.setMessage.bind(state))) ?? true;
      }, 300),
      setMessage(message) {
        this.message = message;
      },
    }),
    {
      name: observable.ref,
      valid: observable.ref,
      message: observable.ref,
    },
    {
      payload,
    },
  );

  useEffect(() => {
    state.validate().catch(() => {});
  }, [name]);

  const errorMessage = state.valid ? ' ' : translate(state.message ?? 'ui_rename_taken_or_invalid');

  return (
    <CommonDialogWrapper size="small" className={className} fixedWidth>
      <CommonDialogHeader title={title} subTitle={subTitle} icon={icon} viewBox={viewBox} bigIcon={bigIcon} onReject={rejectDialog} />
      <CommonDialogBody>
        <Form ref={focusedRef} onSubmit={() => resolveDialog(state.name)}>
          <Container center>
            <InputField name="name" state={state} error={!state.valid} description={errorMessage} onChange={() => state.validate().catch(() => {})}>
              {translate('ui_name')}
            </InputField>
          </Container>
        </Form>
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { footer: true })}>
        <Button type="button" mod={['outlined']} onClick={rejectDialog}>
          {translate('ui_processing_cancel')}
        </Button>
        <Fill />
        <Button type="button" mod={['unelevated']} disabled={!state.valid} onClick={() => resolveDialog(state.name)}>
          {translate(confirmActionText || (create ? 'ui_create' : 'ui_rename'))}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
