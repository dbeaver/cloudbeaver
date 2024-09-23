/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { Container, MenuBarSmallItem, s, Textarea, useClipboard, useS, useTranslate } from '@cloudbeaver/core-blocks';

import type { ILogEntry } from './ILogEntry.js';
import classes from './LogViewerInfoPanel.module.css';

interface Props {
  selectedItem: ILogEntry;
  onClose: () => void;
  className?: string;
}

export const LogViewerInfoPanel = observer<Props>(function LogViewerInfoPanel({ selectedItem, onClose, className }) {
  const styles = useS(classes);
  const translate = useTranslate();
  const copy = useClipboard();

  const typeInfo = `${selectedItem.type} ${selectedItem.time}`;

  const copyMessage = useCallback(() => {
    copy(`${selectedItem.message}\n\n${selectedItem.stackTrace}`, true);
  }, [copy, selectedItem]);

  return (
    <Container className={s(styles, { panelWrapper: true }, className)} vertical>
      <Container className={s(styles, { buttons: true })} noGrow noWrap>
        <Container keepSize noWrap>
          <MenuBarSmallItem className={s(styles, { button: true })} title={translate('ui_copy_to_clipboard')} onClick={copyMessage}>
            {translate('ui_copy_to_clipboard')}
          </MenuBarSmallItem>
          <MenuBarSmallItem className={s(styles, { button: true })} title={translate('ui_close')} onClick={onClose}>
            {translate('ui_close')}
          </MenuBarSmallItem>
        </Container>
      </Container>
      <div className={s(styles, { contentWrapper: true })}>
        <h2 className={s(styles, { type: true })}>{typeInfo}</h2>
        <div className={s(styles, { message: true })} title={selectedItem.message}>
          {selectedItem.message}
        </div>
        <Textarea className={s(styles, { textarea: true })} name="value" rows={3} value={selectedItem.stackTrace} readOnly embedded />
      </div>
    </Container>
  );
});
