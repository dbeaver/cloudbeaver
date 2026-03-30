/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Icon, TableColumnValue, TableItem, useTranslate } from '@cloudbeaver/core-blocks';
import { IconButton } from '@dbeaver/ui-kit';

interface Props {
  id: string;
  name: string;
  className?: string;
  onDelete: (id: string) => void;
}

export const GroupingTableItem = observer<Props>(function GroupingTableItem({ id, name, className, onDelete }) {
  const translate = useTranslate();

  return (
    <TableItem className={className} item={id} title={name}>
      <TableColumnValue width="100%" flex>
        {name}
      </TableColumnValue>
      <TableColumnValue>
        <IconButton size='small' aria-label={translate('ui_remove')} onClick={() => onDelete(id)}>
          <Icon name='cross-bold' width={16} height={16} />
        </IconButton>
      </TableColumnValue>
    </TableItem>
  );
});
