/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-blocks';
import type { IContextMenuItemProps } from '@cloudbeaver/core-ui';
import type { ICustomMenuItemComponent } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_MENU_SEARCH } from './DATA_CONTEXT_MENU_SEARCH';

const styles = css`
  search-box {
    padding: 8px 12px;
  }
`;

export const SearchResourceMenuItemComponent: ICustomMenuItemComponent<IContextMenuItemProps> = observer(function SearchResourceMenuItemComponent({
  item,
  menu,
  onClick,
  menuData,
  className,
  style,
}) {
  const value = menuData.context.tryGet(DATA_CONTEXT_MENU_SEARCH) ?? '';
  function handleChange(value: string) {
    menuData.context.set(DATA_CONTEXT_MENU_SEARCH, value);
  }

  return styled(useStyles(style, styles))(
    <search-box dir="ltr" className={className}>
      <input
        name='search'
        placeholder='Search for resource...'
        value={value}
        autoComplete="off"
        onChange={event => handleChange(event.target.value)}
      />
    </search-box>
  );
});