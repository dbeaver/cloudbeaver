/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import {
  useState, useCallback, ChangeEvent, useRef, useEffect
} from 'react';
import styled, { css } from 'reshadow';

import { Button, useTranslate, useStyles } from '@cloudbeaver/core-blocks';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponent, DialogComponentProps } from '@cloudbeaver/core-dialogs';

const styles = css`
  textarea {
    width: 100% !important;
    min-height: 250px;
    box-sizing: border-box;
  }
  CommonDialogFooter {
    align-items: center;
    justify-content: flex-end;
    gap: 24px;
  }
`;

export const EditorDialog: DialogComponent<string, string> = observer(
  function EditorDialog({
    payload,
    resolveDialog,
    rejectDialog,
  }: DialogComponentProps<string, string>) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = useState(payload);
    const handleChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => setValue(event.target.value), []);
    const handleApply = useCallback(() => resolveDialog(value), [value, resolveDialog]);
    const translate = useTranslate();

    useEffect(() => {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }, []);

    return styled(useStyles(styles))(
      <CommonDialogWrapper>
        <CommonDialogHeader title="app_shared_inlineEditor_dialog_title" onReject={rejectDialog} />
        <CommonDialogBody>
          <textarea ref={textareaRef} value={value} onChange={handleChange} />
        </CommonDialogBody>
        <CommonDialogFooter>
          <Button type="button" mod={['outlined']} onClick={rejectDialog}>
            {translate('app_shared_inlineEditor_dialog_cancel')}
          </Button>
          <Button type="button" mod={['unelevated']} onClick={handleApply}>
            {translate('app_shared_inlineEditor_dialog_apply')}
          </Button>
        </CommonDialogFooter>
      </CommonDialogWrapper>
    );
  }
);
