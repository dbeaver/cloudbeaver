/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, IconOrImage, Link, s, TableColumnValue, TableItem, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { isSameDay } from '@cloudbeaver/core-utils';

import type { ILogEntry } from './ILogEntry.js';
import classes from './LogEntry.module.css';

interface Props {
  item: ILogEntry;
  onSelect: (item: ILogEntry) => void;
  selected?: boolean;
  className?: string;
}

export const LogEntry = observer<Props>(function LogEntry({ item, onSelect, selected = false, className }) {
  const styles = useS(classes);
  const translate = useTranslate();

  const isError = !!item.stackTrace;
  const message = isError ? item.message || translate('ui_error') : item.message;
  let icon: string | null = null;
  const time = new Date(item.time);
  const fullTime = time.toLocaleString();
  const displayTime = isSameDay(time, new Date()) ? time.toLocaleTimeString() : fullTime;

  switch (item.type) {
    case 'ERROR':
      icon = '/icons/error_icon_sm.svg';
      break;
    case 'WARNING':
      icon = '/icons/warning_icon_sm.svg';
      break;
  }

  return (
    <TableItem item={item.id} className={s(styles, { selected }, className)}>
      <TableColumnValue className={s(styles, { icon: true })} title={item.type} centerContent flex>
        <Container>{icon && <IconOrImage className={s(styles, { iconOrImage: true })} icon={icon} />}</Container>
      </TableColumnValue>
      <TableColumnValue title={fullTime} ellipsis>
        {displayTime}
      </TableColumnValue>
      <TableColumnValue>
        <div className={s(styles, { messageCell: true })}>
          <div className={s(styles, { message: true })} title={message}>
            {isError ? (
              <Link className={s(styles, { link: true })} onClick={() => onSelect(item)}>
                {message}
              </Link>
            ) : (
              message
            )}
          </div>
        </div>
      </TableColumnValue>
    </TableItem>
  );
});
