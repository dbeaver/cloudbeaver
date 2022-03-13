/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { use } from 'reshadow';

import { BASE_TABLE_STYLES } from './BASE_TABLE_STYLES';

interface Props {
  colSpan?: number;
  className?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const TableItemSeparator = observer<Props>(function TableItemSeparator({
  colSpan,
  children,
  className,
  onClick,
  onDoubleClick,
}) {
  return styled(BASE_TABLE_STYLES)(
    <tr {...use({ noHover: true })} className={className} onClick={onClick} onDoubleClick={onDoubleClick}>
      <td colSpan={colSpan} {...use({ expandArea: true })}>
        {children}
      </td>
    </tr>
  );
});
