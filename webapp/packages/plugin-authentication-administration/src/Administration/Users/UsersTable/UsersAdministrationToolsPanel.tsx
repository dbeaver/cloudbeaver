/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { getComputed, Loader, ToolsAction, ToolsPanel, useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import { useDataContext, useDataContextLink } from '@cloudbeaver/core-data-context';
import { type IMenuData, MenuActionItem, MenuBaseItem, useMenu } from '@cloudbeaver/core-view';

import { MENU_USERS_ADMINISTRATION } from '../../../Menus/MENU_USERS_ADMINISTRATION.js';
import { DATA_CONTEXT_USERS_ADMINISTRATION_ACTIONS } from './DATA_CONTEXT_USERS_ADMINISTRATION_ACTIONS.js';
import { getUsersAdministrationToolsActions } from './getUsersAdministrationToolsActions.js';

interface Props {
  onUpdate: () => void;
}

export const UsersAdministrationToolsPanel = observer<Props>(function UsersAdministrationToolsPanel({ onUpdate }) {
  const context = useDataContext();
  const translate = useTranslate();

  useDataContextLink(context, (context, id) => {
    context.set(DATA_CONTEXT_USERS_ADMINISTRATION_ACTIONS, { onRefresh: onUpdate }, id);
  });

  const menu = useMenu({ menu: MENU_USERS_ADMINISTRATION, context });
  useAutoLoad(UsersAdministrationToolsPanel, menu.loaders, true, false, true);

  return (
    <ToolsPanel role="toolbar" aria-label={translate('authentication_administration_item_users')} rounded>
      <Loader suspense small inline>
        <UsersAdministrationToolsActions menu={menu} translate={translate} />
      </Loader>
    </ToolsPanel>
  );
});

export const UsersAdministrationToolsActions = observer<{ menu: IMenuData; translate: ReturnType<typeof useTranslate> }>(
  function UsersAdministrationToolsActions({ menu, translate }) {
    const items = menu.items.filter((item): item is MenuActionItem | MenuBaseItem => item instanceof MenuActionItem || item instanceof MenuBaseItem);

    return getUsersAdministrationToolsActions(items, menu.context, translate).map(action => (
      <ToolsAction
        key={action.id}
        icon={action.icon}
        viewBox="0 0 24 24"
        title={action.title}
        disabled={action.disabled}
        loading={action.isLoading && getComputed(action.isLoading)}
        onClick={action.onClick}
      >
        {action.label}
      </ToolsAction>
    ));
  },
);
