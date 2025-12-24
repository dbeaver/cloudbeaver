/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { MenuBar } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { MENU_TREE_TOOLBAR } from './MENU_TREE_TOOLBAR.js';

export interface Props {
  className?: string;
}

export const TreeToolbarMenu = observer<Props>(function TreeToolbarMenu({ className }) {
  const menu = useMenu({ menu: MENU_TREE_TOOLBAR });

  return <MenuBar menu={menu} className={className} />;
});
