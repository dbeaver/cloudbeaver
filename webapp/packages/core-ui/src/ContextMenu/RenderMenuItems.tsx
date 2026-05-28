/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { Suspense } from 'react';

import { type IMenuData } from '@cloudbeaver/core-view';
import { RenderMenuItem } from './RenderMenuItem.js';
import type { IContextMenuNewProps } from './ContextMenu.js';
import type { IMenuItemElementProps, IMenuItemGroupArrowElementProps, IMenuItemGroupElementProps } from '@cloudbeaver/core-blocks';
import type { HovercardStoreState } from '@dbeaver/ui-kit';

interface IRenderMenuItemsProps {
  menu: IMenuData;
  onlyIcons?: boolean;
  placement?: HovercardStoreState['placement'];
  showSubmenuOnHover?: boolean;
  menuComponent: React.FC<IContextMenuNewProps>;
  itemComponent: React.FC<IMenuItemElementProps>;
  groupComponent: React.FC<IMenuItemGroupElementProps>;
  groupArrowComponent: React.FC<IMenuItemGroupArrowElementProps>;
}

export const RenderMenuItems = observer<IRenderMenuItemsProps>(function RenderMenuItems({
  menu,
  onlyIcons,
  placement,
  showSubmenuOnHover,
  menuComponent,
  itemComponent,
  groupComponent,
  groupArrowComponent,
}) {
  return (
    <>
      {menu.items.map(item => (
        <Suspense key={item.id} fallback={null}>
          <RenderMenuItem
            item={item}
            menuData={menu}
            onlyIcons={onlyIcons}
            placement={placement}
            showSubmenuOnHover={showSubmenuOnHover}
            menuComponent={menuComponent}
            itemComponent={itemComponent}
            groupComponent={groupComponent}
            groupArrowComponent={groupArrowComponent}
          />
        </Suspense>
      ))}
    </>
  );
});
