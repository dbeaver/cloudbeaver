/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { getComputed, s, useS } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';
import { useMenu } from '@cloudbeaver/core-view';

import { ContextMenu } from '../../ContextMenu/ContextMenu';
import type { ITabsContext } from '../TabsContext';
import { DATA_CONTEXT_TAB_ID } from './DATA_CONTEXT_TAB_ID';
import { DATA_CONTEXT_TABS_CONTEXT } from './DATA_CONTEXT_TABS_CONTEXT';
import { MENU_TAB } from './MENU_TAB';
import style from './TabMenu.m.css';

interface TabMenuProps extends React.PropsWithChildren {
  tabId: string;
  state: ITabsContext<any>;
  menuContext?: IDataContext;
}

export const TabMenu = observer<TabMenuProps>(function TabMenu({ children, tabId, state, menuContext }) {
  const styles = useS(style);
  const menu = useMenu({
    menu: MENU_TAB,
    context: menuContext,
  });

  menu.context.set(DATA_CONTEXT_TABS_CONTEXT, state);
  menu.context.set(DATA_CONTEXT_TAB_ID, tabId);

  const hidden = getComputed(() => !menu.items.length || menu.items.every(item => item.hidden));

  if (hidden) {
    return null;
  }

  return (
    <div className={s(styles, { portal: true })}>
      <ContextMenu menu={menu} placement="bottom-start" modal disclosure>
        {children}
      </ContextMenu>
    </div>
  );
});
