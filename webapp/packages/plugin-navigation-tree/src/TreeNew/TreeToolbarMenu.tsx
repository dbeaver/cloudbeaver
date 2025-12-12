/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { MenuBar } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_TREE_TOOLBAR } from './DATA_CONTEXT_TREE_TOOLBAR.js';
import type { ITreeToolbar } from './ITreeToolbar.js';
import { MENU_TREE_TOOLBAR } from './MENU_TREE_TOOLBAR.js';

interface Props {
  toolbar: ITreeToolbar;
  className?: string;
}

export const TreeToolbarMenu = observer<Props>(function TreeToolbarMenu({ toolbar, className }) {
  const menu = useMenu({ menu: MENU_TREE_TOOLBAR });

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_TREE_TOOLBAR, toolbar, id);
  });

  return <MenuBar menu={menu} className={className} />;
});
