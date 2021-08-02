/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState, useCallback, useRef, useEffect } from 'react';
import styled, { css } from 'reshadow';

import { Button, InputFieldNew } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponent, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ClipboardService } from '@cloudbeaver/core-ui';

const styles = css`
  CommonDialogWrapper {
    min-width: 400px;
  }
  controls {
    display: flex;
    flex: 1;
    height: 100%;
    align-items: center;
    margin: auto;
    flex-direction: row-reverse;
  }
  Button {
    margin-left: 24px;
  }
`;

interface IPayload {
  inputTitle: string;
  defaultValue: string | number;
}

export const FilterCustomValueDialog: DialogComponent<IPayload, string | number> = observer(
  function FilterCustomValueDialog({
    payload,
    resolveDialog,
    rejectDialog,
  }: DialogComponentProps<IPayload, string | number>) {
    const clipboardService = useService(ClipboardService);
    const inputRef = useRef<HTMLInputElement>(null);

    const [value, setValue] = useState<string | number>(payload.defaultValue);
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

    return styled(styles)(
      <CommonDialogWrapper
        title={translate('data_grid_table_context_menu_filter_dialog_title')}
        footer={(
          <controls as="div">
            <Button type="button" mod={['unelevated']} onClick={handleApply}>
              {translate('ui_processing_ok')}
            </Button>
            <Button type="button" mod={['outlined']} onClick={rejectDialog}>
              {translate('ui_processing_cancel')}
            </Button>
            {clipboardService.clipboardAvailable && clipboardService.state !== 'denied' && (
              <Button type="button" mod={['outlined']} onClick={getValueFromClipboard}>
                {translate('ui_clipboard')}
              </Button>
            )}
          </controls>
        )}
        onReject={rejectDialog}
      >
        <InputFieldNew
          ref={inputRef}
          name='customValue'
          value={value}
          onChange={setValue}
        >
          {payload.inputTitle}
        </InputFieldNew>
      </CommonDialogWrapper>
    );
  }
);
