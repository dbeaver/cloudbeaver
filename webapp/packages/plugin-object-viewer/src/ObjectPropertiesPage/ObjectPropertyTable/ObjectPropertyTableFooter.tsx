/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, type TableState, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_NAV_NODES, type NavNode, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import { MenuBar, MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { MENU_OBJECT_VIEWER_FOOTER } from './MENU_OBJECT_VIEWER_FOOTER';
import styles from './ObjectPropertyTableFooter.m.css';

interface Props {
  state: TableState;
  className?: string;
}

export const ObjectPropertyTableFooter = observer<Props>(function ObjectPropertyTableFooter({ state, className }) {
  const style = useS(MenuBarStyles, MenuBarItemStyles, styles);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const menu = useMenu({ menu: MENU_OBJECT_VIEWER_FOOTER });

  function getSelected() {
    return navNodeInfoResource.get(resourceKeyList(state.selectedList)).filter(Boolean) as NavNode[];
  }

  menu.context.set(DATA_CONTEXT_NAV_NODES, getSelected);

  return <MenuBar className={s(style, { floating: true, withLabel: true }, className)} menu={menu} />;
});
