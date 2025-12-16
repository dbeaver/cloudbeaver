/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useObjectRef, useTranslate } from '@cloudbeaver/core-blocks';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import type { IContextMenuItemProps } from '@cloudbeaver/core-ui';
import type { ICustomMenuItemComponent } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_MENU_SEARCH } from './DATA_CONTEXT_MENU_SEARCH.js';
import { Input, MenuItem } from '@dbeaver/ui-kit';
import { throttle } from '@cloudbeaver/core-utils';

export const ContextMenuSearchItemComponent: ICustomMenuItemComponent<IContextMenuItemProps> = observer(function ContextMenuSearchItemComponent({
  context,
}) {
  const translate = useTranslate();
  const [value, setValue] = useState(context.get(DATA_CONTEXT_MENU_SEARCH) ?? '');
  const contextRefId = useRef<string | null>(null);

  useDataContextLink(context, (context, id) => {
    contextRefId.current = id;
  });

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
  }

  const refObj = useObjectRef({ value, context });
  const updateContext = useCallback(
    throttle(() => {
      if (contextRefId.current) {
        refObj.context.set(DATA_CONTEXT_MENU_SEARCH, refObj.value, contextRefId.current);
      }
    }, 150),
    [],
  );

  useEffect(updateContext, [updateContext, context, value]);

  return (
    <div className="tw:p-2 tw:sticky tw:top-0 tw:z-1 tw:min-w-[200px] tw:bg-(--dbv-kit-menu-popover-background)">
      <MenuItem
        hideOnClick={false}
        render={({ className, ...rest }) => (
          <Input type="search" placeholder={translate('ui_search')} value={value} autoComplete="off" onChange={handleChange} {...rest} />
        )}
        autoFocus
      />
    </div>
  );
});
