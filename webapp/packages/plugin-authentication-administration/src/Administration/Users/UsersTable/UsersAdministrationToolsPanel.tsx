/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, SContext, type StyleRegistry, ToolsAction, ToolsPanel, useTranslate } from '@cloudbeaver/core-blocks';
import { MenuBar, MenuBarItemStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { MENU_USERS_ADMINISTRATION } from '../../../Menus/MENU_USERS_ADMINISTRATION.js';
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
  const translate = useTranslate();
  const menu = useMenu({ menu: MENU_USERS_ADMINISTRATION });

  return (
    <ToolsPanel className={s(styles, { toolsPanel: true })} rounded>
      <SContext registry={registry}>
        <MenuBar menu={menu} className={s(styles, { menuBar: true })} />
      </SContext>
      <ToolsAction title={translate('authentication_administration_tools_refresh_tooltip')} icon="refresh" viewBox="0 0 24 24" onClick={onUpdate}>
        {translate('ui_refresh')}
      </ToolsAction>
    </ToolsPanel>
  );
});
