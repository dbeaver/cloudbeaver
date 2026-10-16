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
import { MenuActionItem, MenuBaseItem, useMenu } from '@cloudbeaver/core-view';

import { MENU_USERS_ADMINISTRATION } from '../../../Menus/MENU_USERS_ADMINISTRATION.js';
import { DATA_CONTEXT_USERS_ADMINISTRATION_ACTIONS } from './DATA_CONTEXT_USERS_ADMINISTRATION_ACTIONS.js';

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
        {menu.items.map(item => {
          if (item.hidden) {
            return null;
          }

          if (item instanceof MenuActionItem) {
            const info = item.action.actionInfo;

            return (
              <ToolsAction
                key={item.id}
                icon={info.icon}
                viewBox="0 0 24 24"
                title={translate(info.tooltip ?? info.label)}
                disabled={item.disabled}
                loading={getComputed(() => item.action.isLoading())}
                onClick={() => {
                  item.events?.onSelect?.(menu.context);
                  item.action.activate();
                }}
              >
                {translate(info.label)}
              </ToolsAction>
            );
          }

          if (item instanceof MenuBaseItem) {
            return (
              <ToolsAction
                key={item.id}
                icon={item.icon}
                viewBox="0 0 24 24"
                title={translate(item.tooltip ?? item.label)}
                disabled={item.disabled}
                onClick={() => item.events?.onSelect?.(menu.context)}
              >
                {translate(item.label)}
              </ToolsAction>
            );
          }

          return null;
        })}
      </Loader>
    </ToolsPanel>
  );
});
