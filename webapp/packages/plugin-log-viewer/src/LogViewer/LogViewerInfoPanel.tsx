/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { MenuBarSmallItem, Textarea, useClipboard, useTranslate } from '@cloudbeaver/core-blocks';


import type { ILogEntry } from './ILogEntry';

const styles = css`
  panel-wrapper {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  content-wrapper {
    display: flex;
    flex-direction: column;
    padding: 0 16px 16px;
    height: 100%;
    overflow: auto;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  buttons {
    padding: 4px;
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
    min-height: 40px;
    max-height: 96px;
  }
  type, message {
    margin-bottom: 12px;
  }
  Textarea {
    flex: 1;
  } 
`;

interface Props {
  selectedItem: ILogEntry;
  onClose: () => void;
  className?: string;
}

export const LogViewerInfoPanel = observer<Props>(function LogViewerInfoPanel({
  selectedItem,
  onClose,
  className,
}) {
  const translate = useTranslate();
  const copy = useClipboard();

  const typeInfo = `${selectedItem.type} ${selectedItem.time}`;

  const copyMessage = useCallback(() => {
    copy(`${selectedItem.message}\n\n${selectedItem.stackTrace}`, true);
  }, [copy, selectedItem]);

  return styled(styles)(
    <panel-wrapper className={className}>
      <buttons>
        <MenuBarSmallItem
          title={translate('ui_copy_to_clipboard')}
          onClick={copyMessage}
        >
          {translate('ui_copy_to_clipboard')}
        </MenuBarSmallItem>
        <MenuBarSmallItem
          title={translate('ui_close')}
          onClick={onClose}
        >
          {translate('ui_close')}
        </MenuBarSmallItem>
      </buttons>
      <content-wrapper>
        <type as='h2'>{typeInfo}</type>
        <message title={selectedItem.message}>{selectedItem.message}</message>
        <Textarea
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
