/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { ADMINISTRATION_TOOLS_PANEL_STYLES, IAdministrationItemSubItem } from '@cloudbeaver/core-administration';
import { AdminUser, UsersResource } from '@cloudbeaver/core-authentication';
import { Table, TableHeader, TableColumnHeader, TableBody, TableSelect, useMapResource, ToolsAction, ToolsPanel, Loader, BASE_LAYOUT_GRID_STYLES } from '@cloudbeaver/core-blocks';
import { useController, useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import { filterUndefined } from '@cloudbeaver/core-utils';

import { CreateUser } from './CreateUser';
import { CreateUserService } from './CreateUserService';
import { User } from './User';
import { UsersTableController } from './UsersTableController';

const layoutStyles = css`
    layout-grid {
      width: 100%;
      overflow: auto;
    }

    layout-grid-inner {
      min-height: 100%;
    }

    layout-grid-cell {
      composes: theme-background-surface theme-text-on-surface theme-border-color-background from global;
      position: relative;
      border: solid 1px;
    }
  `;

const loaderStyle = css`
  ExceptionMessage {
    padding: 24px;
  }
`;

const styles = css`
  Table {
    width: 100%;
  }

  [|table] {
    min-height: 140px; /* loader overlay size */
  }

  ToolsPanel {
    border-bottom: none;
  }
`;

interface Props {
  sub?: IAdministrationItemSubItem;
  param?: string | null;
}

export const UsersTable = observer<Props>(function UsersTable({ sub, param }) {
  const translate = useTranslate();
  const style = useStyles(BASE_LAYOUT_GRID_STYLES, styles, ADMINISTRATION_TOOLS_PANEL_STYLES, layoutStyles);
  const createUserService = useService(CreateUserService);
  const controller = useController(UsersTableController);
  const usersResource = useMapResource(UsersTable, UsersResource, CachedMapAllKey);
  const isLocalProviderAvailable = controller.isLocalProviderAvailable;
  const users = usersResource.data
    .filter<AdminUser>(filterUndefined)
    .sort((a, b) => {
      if (usersResource.resource.isNew(a.userId) === usersResource.resource.isNew(b.userId)) {
        return a.userId.localeCompare(b.userId);
      }
      if (usersResource.resource.isNew(a.userId)) {
        return -1;
      }
      return 1;
    });

  const create = param === 'create';
  const keys = users.map(user => user.userId);

  return styled(style)(
    <layout-grid>
      <layout-grid-inner>
        <layout-grid-cell data-span='12'>
          <ToolsPanel>
            {isLocalProviderAvailable && (
              <ToolsAction
                title={translate('authentication_administration_tools_add_tooltip')}
                icon="add"
                viewBox="0 0 24 24"
                disabled={create && !!createUserService.user}
                onClick={createUserService.create}
              >
                {translate('ui_add')}
              </ToolsAction>
            )}
            <ToolsAction
              title={translate('authentication_administration_tools_refresh_tooltip')}
              icon="refresh"
              viewBox="0 0 24 24"
              onClick={controller.update}
            >
              {translate('ui_refresh')}
            </ToolsAction>
            {isLocalProviderAvailable && (
              <ToolsAction
                title={translate('authentication_administration_tools_delete_tooltip')}
                icon="trash"
                viewBox="0 0 24 24"
                disabled={!controller.itemsSelected}
                onClick={controller.delete}
              >
                {translate('ui_delete')}
              </ToolsAction>
            )}
          </ToolsPanel>
        </layout-grid-cell>

        {create && createUserService.user && (
          <layout-grid-cell data-span='12'>
            <CreateUser user={createUserService.user} onCancel={createUserService.cancelCreate} />
          </layout-grid-cell>
        )}
        <layout-grid-cell data-span='12' {...use({ table: true })}>
          <Loader style={loaderStyle} state={usersResource} overlay>
            <Table
              keys={keys}
              selectedItems={controller.selectedItems}
              expandedItems={controller.expandedItems}
              size='big'
            >
              <TableHeader>
                {isLocalProviderAvailable && (
                  <TableColumnHeader min flex centerContent>
                    <TableSelect />
                  </TableColumnHeader>
                )}
                <TableColumnHeader min />
                <TableColumnHeader>{translate('authentication_user_name')}</TableColumnHeader>
                <TableColumnHeader>{translate('authentication_user_role')}</TableColumnHeader>
                <TableColumnHeader>{translate('authentication_user_enabled')}</TableColumnHeader>
                <TableColumnHeader />
              </TableHeader>
              <TableBody>
                {users.map(user => <User key={user.userId} user={user} selectable={isLocalProviderAvailable} />)}
              </TableBody>
            </Table>
          </Loader>
        </layout-grid-cell>
      </layout-grid-inner>
    </layout-grid>
  );
});
