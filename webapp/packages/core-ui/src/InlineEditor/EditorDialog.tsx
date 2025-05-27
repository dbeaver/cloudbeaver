/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  s,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent, DialogComponentProps } from '@cloudbeaver/core-dialogs';

import style from './EditorDialog.module.css';

export const EditorDialog: DialogComponent<string, string> = observer(function EditorDialog({
  payload,
  resolveDialog,
  rejectDialog,
}: DialogComponentProps<string, string>) {
  const styles = useS(style);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(payload);
  const handleChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => setValue(event.target.value), []);
  const handleApply = useCallback(() => resolveDialog(value), [value, resolveDialog]);
  const translate = useTranslate();

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  return (
    <CommonDialogWrapper>
      <CommonDialogHeader title="app_shared_inlineEditor_dialog_title" onReject={rejectDialog} />
      <CommonDialogBody>
        <textarea ref={textareaRef} className={s(styles, { textarea: true })} value={value} onChange={handleChange} />
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { footer: true })}>
        <Button type="button" variant="secondary" onClick={rejectDialog}>
          {translate('app_shared_inlineEditor_dialog_cancel')}
        </Button>
        <Button type="button" onClick={handleApply}>
          {translate('app_shared_inlineEditor_dialog_apply')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
