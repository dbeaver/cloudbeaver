/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { Filter, useTranslate } from '@cloudbeaver/core-blocks';
import { useDataContext } from '@cloudbeaver/core-data-context';
import { CaptureViewContext } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_TREE_FILTER } from './DATA_CONTEXT_TREE.js';

export const TreeToolbarFilter = observer(function TreeToolbarFilter() {
  const translate = useTranslate();
  const viewContext = useContext(CaptureViewContext);
  const context = useDataContext(viewContext);
  const filter = context.get(DATA_CONTEXT_TREE_FILTER);

  if (!filter) {
    return null;
  }

  return (
    <Filter
      placeholder={translate(filter.filterPlaceholder ?? 'app_navigationTree_search')}
      value={filter.filter}
      onChange={value => filter.setFilter(value as string)}
    />
  );
});
