/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, StaticImage, TableColumnValue, TableItem, TableItemSelect, useS } from '@cloudbeaver/core-blocks';

import styles from './ConnectionFormAccessTableItem.module.css';

interface Props {
  id: any;
  name: string;
  icon: string;
  disabled: boolean;
  iconTooltip?: string;
  tooltip?: string;
  description?: string;
  className?: string;
}

export const ConnectionFormAccessTableItem = observer<Props>(function ConnectionFormAccessTableItem({
  id,
  name,
  description,
  icon,
  iconTooltip,
  tooltip,
  disabled,
  className,
}) {
  const style = useS(styles);
  return (
    <TableItem item={id} title={tooltip} disabled={disabled} selectDisabled={disabled} className={className}>
      <TableColumnValue centerContent flex>
        <TableItemSelect disabled={disabled} />
      </TableColumnValue>
      <TableColumnValue>
        <StaticImage className={s(style, { staticImage: true })} icon={icon} title={iconTooltip} />
      </TableColumnValue>
      <TableColumnValue>{name}</TableColumnValue>
      <TableColumnValue>{description}</TableColumnValue>
    </TableItem>
  );
});
