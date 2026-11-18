/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import type { DbAdminLockItemListFragment } from '@cloudbeaver/core-sdk';

import { DBAdminTable } from '../components/DBAdminTable.js';

interface Props {
  title: string;
  list: DbAdminLockItemListFragment | undefined;
}

export const LockItemsTable = observer<Props>(function LockItemsTable({ title, list }) {
  const translate = useTranslate();
  const items = list?.items;
  const rows = useMemo(() => (items ?? []).map((item, index) => ({ id: String(index), values: item.values })), [items]);
  const heading = list?.sessionId ? `${title} (${list.sessionId})` : title;

  return (
    <section aria-label={heading} className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1">
      <h4 className="tw:m-0 tw:text-sm">{heading}</h4>
      <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col">
        {rows.length > 0 && list ? (
          <DBAdminTable columns={list.columns} rows={rows} className="tw:h-full" />
        ) : (
          <TextPlaceholder>{translate('plugin_dbadmin_no_lock_items')}</TextPlaceholder>
        )}
      </div>
    </section>
  );
});
