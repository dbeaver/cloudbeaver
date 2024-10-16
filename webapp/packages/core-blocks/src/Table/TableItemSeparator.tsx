/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s } from '../s.js';
import { useS } from '../useS.js';
import cellStyles from './TableColumnValue.module.css';
import rowStyles from './TableItem.module.css';

interface Props {
  colSpan?: number;
  className?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const TableItemSeparator = observer<React.PropsWithChildren<Props>>(function TableItemSeparator({
  colSpan,
  children,
  className,
  onClick,
  onDoubleClick,
}) {
  const styles = useS(rowStyles, cellStyles);

  return (
    <tr className={s(styles, { noHover: true, row: true }, className)} onClick={onClick} onDoubleClick={onDoubleClick}>
      <td colSpan={colSpan} className={s(styles, { expandArea: true, cell: true })}>
        {children}
      </td>
    </tr>
  );
});
