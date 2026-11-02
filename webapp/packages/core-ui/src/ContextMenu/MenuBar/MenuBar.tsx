/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Loader, s, useS } from '@cloudbeaver/core-blocks';

import { ContextMenu } from '../ContextMenu.js';
import type { IMenuBarProps } from './IMenuBarProps.js';
import style from './MenuBar.module.css';
import { MenuBarItem } from './MenuBarItem.js';
import { Menubar, MenuProvider, useMenubarStore } from '@dbeaver/ui-kit';
import { RenderMenuItems } from '../RenderMenuItems.js';
import { MenuBarGroup } from './MenuBarGroup.js';
import { MenuBarGroupArrow } from './MenuBarGroupArrow.js';
import { MenuContext, type IMenuContext } from '../MenuContext.js';
import { useLayoutEffect, useMemo } from 'react';

export const MenuBar = observer<IMenuBarProps>(function MenuBar({ menu, compact = true, rtl, className, ref, ...props }) {
  const styles = useS(style);
  const items = menu.visibleItems;
  useLayoutEffect(() => {
    menu.setOpen(true, false);
    return () => menu.setOpen(false);
  }, [menu]);
  const menubarStore = useMenubarStore({ rtl });
  const menuContext = useMemo<IMenuContext>(() => ({ menu, rtl }), [menu, rtl]);

  if (!items.length) {
    return null;
  }

  return (
    <MenuContext value={menuContext}>
      <Menubar ref={ref} store={menubarStore} className={s(styles, { menuBar: true }, className)} focusable {...props}>
        <MenuProvider>
          <Loader state={menu} small inline>
            <RenderMenuItems
              menu={menu}
              onlyIcons={compact}
              placement="bottom-start"
              showSubmenuOnHover={false}
              menuComponent={ContextMenu}
              itemComponent={MenuBarItem}
              groupComponent={MenuBarGroup}
              groupArrowComponent={MenuBarGroupArrow}
            />
          </Loader>
        </MenuProvider>
      </Menubar>
    </MenuContext>
  );
});
