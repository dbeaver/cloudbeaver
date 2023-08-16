/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource } from '@cloudbeaver/core-authentication';
import { s, SContext, StyleRegistry, ToolsAction, ToolsPanel, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { MenuBar, MenuBarItemStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { MENU_USERS_ADMINISTRATION } from '../../../Menus/MENU_USERS_ADMINISTRATION';
import { CreateUserService } from './CreateUserService';
import styles from './UsersAdministrationToolsPanel.m.css';
import UsersAdministrationMenuBarItemStyles from './UsersAdministrationMenuBarItemStyles.m.css';

interface Props {
  create: boolean;
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

export const UsersAdministrationToolsPanel = observer<Props>(function UsersAdministrationToolsPanel({ create, onUpdate }) {
  const createUserService = useService(CreateUserService);
  const authProvidersResource = useResource(UsersAdministrationToolsPanel, AuthProvidersResource, CachedMapAllKey);
  const translate = useTranslate();
  const isLocalProviderAvailable = authProvidersResource.resource.has(AUTH_PROVIDER_LOCAL_ID);
  const menu = useMenu({ menu: MENU_USERS_ADMINISTRATION });

  return (
    <ToolsPanel className={s(styles, { toolsPanel: true })}>
      {isLocalProviderAvailable && (
        <ToolsAction
          title={translate('authentication_administration_tools_add_tooltip')}
          icon="add"
          viewBox="0 0 24 24"
          disabled={create && !!createUserService.user}
          onClick={createUserService.create}
        >
          {translate('ui_create')}
        </ToolsAction>
      )}
      <SContext registry={registry}>
        <MenuBar menu={menu} className={s(styles, { menuBar: true })} />
      </SContext>
      <ToolsAction title={translate('authentication_administration_tools_refresh_tooltip')} icon="refresh" viewBox="0 0 24 24" onClick={onUpdate}>
        {translate('ui_refresh')}
      </ToolsAction>
    </ToolsPanel>
  );
});
