/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useRef } from 'react';

import { s, useS } from '@cloudbeaver/core-blocks';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import type { IContextMenuItemProps } from '@cloudbeaver/core-ui';
import type { ICustomMenuItemComponent } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_MENU_SEARCH } from './DATA_CONTEXT_MENU_SEARCH.js';
import styles from './SearchResourceMenuItemComponent.module.css';

export const SearchResourceMenuItemComponent: ICustomMenuItemComponent<IContextMenuItemProps> = observer(function SearchResourceMenuItemComponent({
  context,
  className,
}) {
  const style = useS(styles);
  const value = context.get(DATA_CONTEXT_MENU_SEARCH) ?? '';
  const contextRefId = useRef<string | null>(null);

  useDataContextLink(context, (context, id) => {
    contextRefId.current = id;
  });

  function handleChange(value: string) {
    if (contextRefId.current) {
      context.set(DATA_CONTEXT_MENU_SEARCH, value, contextRefId.current);
    }
  }

  return (
    <div dir="ltr" className={s(style, { searchBox: true }, className)}>
      <input
        name="search"
        type="search"
        placeholder="Search for resource..."
        value={value}
        autoComplete="off"
        onChange={event => handleChange(event.target.value)}
      />
    </div>
  );
});
