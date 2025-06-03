/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  InputField,
  s,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponent, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { ClipboardService } from '@cloudbeaver/core-ui';

import style from './FilterCustomValueDialog.module.css';

interface IPayload {
  inputTitle: string;
  defaultValue: string;
}

export const FilterCustomValueDialog: DialogComponent<IPayload, string | number> = observer(function FilterCustomValueDialog({
  payload,
  resolveDialog,
  rejectDialog,
}: DialogComponentProps<IPayload, string | number>) {
  const clipboardService = useService(ClipboardService);
  const styles = useS(style);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [value, setValue] = useState(payload.defaultValue);
  const handleApply = useCallback(() => resolveDialog(value), [value, resolveDialog]);
  const translate = useTranslate();

  const getValueFromClipboard = useCallback(async () => {
    const value = await clipboardService.read();
    if (value) {
      setValue(value);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [clipboardService]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <CommonDialogWrapper size="small">
      <CommonDialogHeader title="data_grid_table_context_menu_filter_dialog_title" onReject={rejectDialog} />
      <CommonDialogBody noOverflow>
        <InputField ref={inputRef} name="customValue" value={value} onChange={setValue}>
          {payload.inputTitle}
        </InputField>
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { footer: true })}>
        {clipboardService.clipboardAvailable && clipboardService.state !== 'denied' && (
          <Button type="button" variant="secondary" onClick={getValueFromClipboard}>
            {translate('ui_clipboard')}
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={rejectDialog}>
          {translate('ui_processing_cancel')}
        </Button>
        <Button type="button" onClick={handleApply}>
          {translate('ui_processing_ok')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
