/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

type Props = React.PropsWithChildren<{
  colSpan?: number;
  className?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
}>

export const TableItemSeparator = observer(function TableItemSeparator({
  colSpan,
  children,
  className,
  onClick,
  onDoubleClick,
}: Props) {

  return styled(useStyles())(
    <tr {...use({ noHover: true })} className={className} onClick={onClick} onDoubleClick={onDoubleClick}>
      <td colSpan={colSpan} {...use({ expandArea: true })}>
        {children}
      </td>
    </tr>
  );
});
