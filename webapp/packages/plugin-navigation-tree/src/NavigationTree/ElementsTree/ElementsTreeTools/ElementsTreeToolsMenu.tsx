/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { MenuBar, MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_ELEMENTS_TREE } from '../DATA_CONTEXT_ELEMENTS_TREE.js';
import type { IElementsTree } from '../useElementsTree.js';
import elementsTreeMenuBarItemStyles from './ElementsTreeMenuBarItem.module.css';
import style from './ElementsTreeToolsMenu.module.css';
import { MENU_ELEMENTS_TREE_TOOLS } from './MENU_ELEMENTS_TREE_TOOLS.js';

interface Props {
  tree: IElementsTree;
  className?: string;
}

const registry: StyleRegistry = [
  [
    MenuBarItemStyles,
    {
      mode: 'append',
      styles: [elementsTreeMenuBarItemStyles],
    },
  ],
];

export const ElementsTreeToolsMenu = observer<Props>(function ElementsTreeToolsMenu({ tree, className }) {
  const styles = useS(style);
  const menuBarStyles = useS(MenuBarStyles, MenuBarItemStyles);
  const menu = useMenu({ menu: MENU_ELEMENTS_TREE_TOOLS });

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_ELEMENTS_TREE, tree, id);
  });

  return (
    <SContext registry={registry}>
      <div className={s(styles, { wrapper: true }, className)}>
        <MenuBar className={s(elementsTreeMenuBarItemStyles, { toolsMenu: true }, menuBarStyles['floating'])} menu={menu} />
      </div>
    </SContext>
  );
});
