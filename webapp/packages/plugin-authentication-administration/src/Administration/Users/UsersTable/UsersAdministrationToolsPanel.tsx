/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, SContext, type StyleRegistry, ToolsPanel } from '@cloudbeaver/core-blocks';
import { useDataContext, useDataContextLink } from '@cloudbeaver/core-data-context';
import { MenuBar, MenuBarItemStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { MENU_USERS_ADMINISTRATION } from '../../../Menus/MENU_USERS_ADMINISTRATION.js';
import { DATA_CONTEXT_USERS_ADMINISTRATION_ACTIONS } from './DATA_CONTEXT_USERS_ADMINISTRATION_ACTIONS.js';
import UsersAdministrationMenuBarItemStyles from './UsersAdministrationMenuBarItemStyles.module.css';
import styles from './UsersAdministrationToolsPanel.module.css';

interface Props {
  onUpdate: () => void;
}

const registry: StyleRegistry = [
  [
    MenuBarItemStyles,
    {
      mode: 'append',
      styles: [UsersAdministrationMenuBarItemStyles],
    },
  ],
];

export const UsersAdministrationToolsPanel = observer<Props>(function UsersAdministrationToolsPanel({ onUpdate }) {
  const context = useDataContext();

  useDataContextLink(context, (context, id) => {
    context.set(DATA_CONTEXT_USERS_ADMINISTRATION_ACTIONS, { onRefresh: onUpdate }, id);
  });

  const menu = useMenu({ menu: MENU_USERS_ADMINISTRATION, context });

  return (
    <ToolsPanel className={s(styles, { toolsPanel: true })} rounded>
      <SContext registry={registry}>
        <MenuBar menu={menu} className={s(styles, { menuBar: true })} compact={false} />
      </SContext>
    </ToolsPanel>
  );
});
