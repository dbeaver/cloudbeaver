/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useRef } from 'react';

import { InputField, useTranslate } from '@cloudbeaver/core-blocks';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import type { IContextMenuItemProps } from '@cloudbeaver/core-ui';
import type { ICustomMenuItemComponent } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_MENU_SEARCH } from './DATA_CONTEXT_MENU_SEARCH.js';

export const ContextMenuSearchItemComponent: ICustomMenuItemComponent<IContextMenuItemProps> = observer(function ContextMenuSearchItemComponent({
  context,
}) {
  const translate = useTranslate();
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
    <div className="tw:px-1 tw:sticky tw:top-0 tw:z-1 tw:min-w-[200px]">
      <InputField type="search" placeholder={translate('ui_search')} value={value} autoComplete="off" onChange={handleChange} />
    </div>
  );
});
