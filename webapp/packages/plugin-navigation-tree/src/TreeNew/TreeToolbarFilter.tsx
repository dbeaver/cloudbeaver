/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Filter, useTranslate } from '@cloudbeaver/core-blocks';

import type { ITreeFilter } from './useTreeFilter.js';

interface Props {
  filter?: ITreeFilter & { filterPlaceholder?: string };
  filterEnabled?: boolean;
}

export const TreeToolbarFilter = observer<Props>(function TreeToolbarFilter({ filter, filterEnabled }) {
  const translate = useTranslate();

  if (!filterEnabled || !filter) {
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
