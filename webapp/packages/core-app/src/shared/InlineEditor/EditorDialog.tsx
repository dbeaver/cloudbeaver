/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import {
  useState, useCallback, ChangeEvent, useRef, useEffect,
} from 'react';
import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper, DialogComponent, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

const styles = css`
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
  textarea {
    width: 100% !important;
    min-height: 250px;
    box-sizing: border-box;
  }
`;

export const EditorDialog: DialogComponent<string, string> = observer(
  function EditorDialog(props: DialogComponentProps<string, string>) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = useState(props.payload);
    const handleChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => setValue(event.target.value), []);
    const handleApply = useCallback(() => props.resolveDialog(value), [value, props.resolveDialog]);
    const translate = useTranslate();

    useEffect(() => {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }, []);

    return styled(useStyles(styles))(
      <CommonDialogWrapper
        title={translate('app_shared_inlineEditor_dialog_title')}
        onReject={props.rejectDialog}
        footer={(
          <controls as="div">
            <Button type="button" mod={['unelevated']} onClick={handleApply}>
              {translate('app_shared_inlineEditor_dialog_apply')}
            </Button>
            <Button type="button" mod={['outlined']} onClick={props.rejectDialog}>
              {translate('app_shared_inlineEditor_dialog_cancel')}
            </Button>
          </controls>
        )}
      >
        <textarea value={value} onChange={handleChange} ref={textareaRef}/>
      </CommonDialogWrapper>
    );
  }
);
