/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import {
  useState, useCallback, ChangeEvent, useRef, useEffect
} from 'react';
import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper, DialogComponent, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

const dialogStyle = css`
  footer {
    align-items: center;
    justify-content: flex-end;
    gap: 24px;
  }
`;

const styles = css`
  textarea {
    width: 100% !important;
    min-height: 250px;
    box-sizing: border-box;
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
      <CommonDialogWrapper
        title="app_shared_inlineEditor_dialog_title"
        footer={(
          <>
            <Button type="button" mod={['outlined']} onClick={rejectDialog}>
              {translate('app_shared_inlineEditor_dialog_cancel')}
            </Button>
            <Button type="button" mod={['unelevated']} onClick={handleApply}>
              {translate('app_shared_inlineEditor_dialog_apply')}
            </Button>
          </>
        )}
        style={dialogStyle}
        onReject={rejectDialog}
      >
        <textarea ref={textareaRef} value={value} onChange={handleChange} />
      </CommonDialogWrapper>
    );
  }
);
