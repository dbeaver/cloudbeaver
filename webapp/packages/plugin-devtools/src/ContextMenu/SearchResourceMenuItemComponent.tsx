/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useS } from '@cloudbeaver/core-blocks';
import type { IContextMenuItemProps } from '@cloudbeaver/core-ui';
import type { ICustomMenuItemComponent } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_MENU_SEARCH } from './DATA_CONTEXT_MENU_SEARCH';
import styles from './SearchResourceMenuItemComponent.m.css';

export const SearchResourceMenuItemComponent: ICustomMenuItemComponent<IContextMenuItemProps> = observer(function SearchResourceMenuItemComponent({
  item,
  onClick,
  menuData,
  className,
}) {
  const style = useS(styles);
  const value = menuData.context.tryGet(DATA_CONTEXT_MENU_SEARCH) ?? '';
  function handleChange(value: string) {
    menuData.context.set(DATA_CONTEXT_MENU_SEARCH, value);
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
