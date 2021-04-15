/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { Button, TextareaNew, useClipboard } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

import type { ILogEntry } from './ILogEntry';

const styles = css`
  panel-wrapper {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  content-wrapper {
    padding: 0 16px 16px;
    height: 100%;
    overflow: auto;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  buttons {
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  buttons Button:first-child {
    margin-right: 24px;
  }
  type {
    composes: theme-typography--body2 from global;
    margin: 0;
    font-weight: 500;
  }
  message {
    overflow: auto;
    max-height: 96px;
  }
  type, message {
    margin-bottom: 12px;
  }
  
`;

interface Props {
  selectedItem: ILogEntry;
  onClose: () => void;
  className?: string;
}

export const LogViewerInfoPanel: React.FC<Props> = observer(function LogViewerInfoPanel({ selectedItem, onClose, className }) {
  const translate = useTranslate();
  const copy = useClipboard();

  const typeInfo = `${selectedItem.type} ${selectedItem.time}`;

  const сopyMessage = useCallback(() => {
    copy(`${selectedItem.message}\n\n${selectedItem.stackTrace}`, true);
  }, [copy, selectedItem]);

  return styled(styles)(
    <panel-wrapper as='div' className={className}>
      <buttons as='div'>
        <Button mod={['unelevated']} onClick={сopyMessage}>
          {translate('ui_copy_to_clipboard')}
        </Button>
        <Button mod={['outlined']} onClick={onClose}>
          {translate('ui_close')}
        </Button>
      </buttons>
      <content-wrapper as='div'>
        <type as='h2'>{typeInfo}</type>
        <message as='div' title={selectedItem.message}>{selectedItem.message}</message>
        <TextareaNew
          name="value"
          rows={3}
          value={selectedItem.stackTrace}
          readOnly
          embedded
        />
      </content-wrapper>
    </panel-wrapper>
  );
});
