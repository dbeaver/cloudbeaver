/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { getComputed, Icon, s, useS } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';
import { useMenu } from '@cloudbeaver/core-view';

import { ContextMenu } from '../../ContextMenu/ContextMenu';
import type { ITabsContext } from '../TabsContext';
import { DATA_CONTEXT_TAB_ID } from './DATA_CONTEXT_TAB_ID';
import { DATA_CONTEXT_TABS_CONTEXT } from './DATA_CONTEXT_TABS_CONTEXT';
import { MENU_TAB } from './MENU_TAB';
import TabStyles from './Tab.m.css';
import TabActionsStyles from './TabActions.m.css';
import TabMenuStyles from './TabMenu.m.css';

export interface TabMenuProps {
  tabId: string;
  state: ITabsContext<any>;
  menuContext?: IDataContext;
}

export const TabMenu = observer<TabMenuProps>(function TabMenu({ tabId, state, menuContext }) {
  const styles = useS(TabStyles, TabActionsStyles, TabMenuStyles);

  const [menuOpened, switchState] = useState(false);
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
    <div className={s(styles, { portal: true, portalMenuOpened: menuOpened })}>
      <ContextMenu menu={menu} placement="bottom-start" modal disclosure onVisibleSwitch={switchState}>
        <div className={s(styles, { tabAction: true })}>
          <Icon className={s(styles, { tabIcon: true })} name="dots" viewBox="0 0 32 32" />
        </div>
      </ContextMenu>
    </div>
  );
});
