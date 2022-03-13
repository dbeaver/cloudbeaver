/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { BASE_TABLE_STYLES, IconOrImage, Link } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import type { ILogEntry } from './ILogEntry';

interface Props {
  item: ILogEntry;
  onSelect: (item: ILogEntry) => void;
  selected?: boolean;
  className?: string;
}

const style = css`
  message-cell {
    display: flex;
    align-items: center;
  }
  message {
    word-break: break-word;
    white-space: nowrap;
    overflow: hidden;
    padding-right: 16px;
    text-overflow: ellipsis;
  }
  Link {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  Link:hover {
    cursor: pointer;
  }
  td:first-child {
    padding: 0px;
  }
  icon-box {
    display: flex;
    align-content: center;
    justify-content: center;

    & IconOrImage {
      width: 24px;
      height: 24px;
    }
  }
  tr[|selected] {
    font-weight: 500;
  }
`;

export const LogEntry = observer<Props>(function LogEntry({
  item,
  onSelect,
  selected = false,
  className,
}) {
  const translate = useTranslate();

  const isError = !!item.stackTrace;
  const message = isError ? item.message || translate('ui_error') : item.message;
  let icon: string | null = null;

  switch (item.type) {
    case 'ERROR':
      icon = '/icons/error_icon_sm.svg';
      break;
    case 'WARNING':
      icon = '/icons/warning_icon_sm.svg';
      break;
  }

  return styled(useStyles(BASE_TABLE_STYLES, style))(
    <tr className={className} {...use({ selected })}>
      <td title={item.type}><icon-box>{icon && <IconOrImage icon={icon} />}</icon-box></td>
      <td>{item.time}</td>
      <td>
        <message-cell>
          <message title={message}>
            {isError ? (
              <Link onClick={() => onSelect(item)}>
                {message}
              </Link>
            ) : message}
          </message>
        </message-cell>
      </td>
    </tr>
  );
});
