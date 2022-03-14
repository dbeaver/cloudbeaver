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
import { BASE_CONTAINERS_STYLES, BASE_LAYOUT_GRID_STYLES, ToolsAction, ToolsPanel } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { CreateRole } from './CreateRole';
import { CreateRoleService } from './CreateRoleService';
import { RolesTable } from './RolesTable/RolesTable';
import { useRolesTable } from './RolesTable/useRolesTable';

const styles = css` 
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
    ToolsPanel {
      border-bottom: none;
    }
    [|table] {
      min-height: 140px; /* loader overlay size */
    }
`;

interface Props {
  sub?: IAdministrationItemSubItem;
  param?: string | null;
}

export const RolesPage = observer<Props>(function RolesPage({
  sub,
  param,
}) {
  const translate = useTranslate();
  const style = useStyles(BASE_LAYOUT_GRID_STYLES, styles, ADMINISTRATION_TOOLS_PANEL_STYLES, BASE_CONTAINERS_STYLES);
  const service = useService(CreateRoleService);

  const table = useRolesTable();
  const create = param === 'create';

  return styled(style)(
    <layout-grid>
      <layout-grid-inner>
        <layout-grid-cell data-span='12'>
          <ToolsPanel>
            <ToolsAction
              title={translate('administration_roles_add_tooltip')}
              icon="add"
              viewBox="0 0 24 24"
              disabled={create || table.processing}
              onClick={service.create}
            >
              {translate('ui_add')}
            </ToolsAction>
            <ToolsAction
              title={translate('administration_roles_refresh_tooltip')}
              icon="refresh"
              viewBox="0 0 24 24"
              disabled={table.processing}
              onClick={table.update}
            >
              {translate('ui_refresh')}
            </ToolsAction>
            <ToolsAction
              title={translate('administration_roles_delete_tooltip')}
              icon="trash"
              viewBox="0 0 24 24"
              disabled={!table.tableState.itemsSelected || table.processing}
              onClick={table.delete}
            >
              {translate('ui_delete')}
            </ToolsAction>
          </ToolsPanel>
        </layout-grid-cell>
        {create && (
          <layout-grid-cell data-span='12'>
            <CreateRole />
          </layout-grid-cell>
        )}
        <layout-grid-cell data-span='12' {...use({ table: true })}>
          <RolesTable
            roles={table.roles}
            state={table.state}
            selectedItems={table.tableState.selected}
            expandedItems={table.tableState.expanded}
          />
        </layout-grid-cell>
      </layout-grid-inner>
    </layout-grid>
  );
});
