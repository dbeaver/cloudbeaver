/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import type { IAdministrationItemSubItem } from '@cloudbeaver/core-administration';
import { UserMetaParametersResource } from '@cloudbeaver/core-authentication';
import { Table, TableHeader, TableColumnHeader, TableBody, TableSelect, useDataResource, ToolsPanel, ToolsAction, Loader, BASE_LAYOUT_GRID_STYLES } from '@cloudbeaver/core-blocks';
import { useController, useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { CreateMetaParameter } from './CreateMetaParameter';
import { CreateMetaParameterService } from './CreateMetaParameterService';
import { MetadataParam } from './MetadataParam';
import { MetaParametersController } from './MetaParametersController';

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

const styles = css`
  Table {
    width: 100%;
  }
`;

interface Props {
  sub?: IAdministrationItemSubItem;
  param?: string | null;
}

export const MetaParameters = observer<Props>(function MetaParameters({ sub, param }) {
  const translate = useTranslate();
  const controller = useController(MetaParametersController);
  const createMetaParameterService = useService(CreateMetaParameterService);
  const userMetaParametersResource = useDataResource(MetaParameters, UserMetaParametersResource, undefined);
  const keys = userMetaParametersResource.data.map(metadata => metadata.id);
  const isLocalProviderAvailable = controller.isLocalProviderAvailable;

  return styled(useStyles(BASE_LAYOUT_GRID_STYLES, styles, layoutStyles))(
    <layout-grid>
      <layout-grid-inner>
        <layout-grid-cell data-span='12'>
          <ToolsPanel>
            {isLocalProviderAvailable && (
              <ToolsAction
                title={translate('authentication_administration_tools_add_tooltip')}
                icon="add"
                viewBox="0 0 24 24"
                disabled={(sub && !!createMetaParameterService.user) || true}
                onClick={createMetaParameterService.create}
              >
                {translate('ui_add')}
              </ToolsAction>
            )}
            <ToolsAction
              title={translate('authentication_administration_tools_refresh_tooltip')}
              icon="refresh"
              viewBox="0 0 24 24"
              onClick={userMetaParametersResource.reload}
            >
              {translate('ui_refresh')}
            </ToolsAction>
            {isLocalProviderAvailable && (
              <ToolsAction
                title={translate('authentication_administration_tools_delete_tooltip')}
                icon="trash"
                viewBox="0 0 24 24"
                disabled={!controller.itemsSelected || true}
                onClick={controller.delete}
              >
                {translate('ui_delete')}
              </ToolsAction>
            )}
          </ToolsPanel>
        </layout-grid-cell>

        {param === 'create' && createMetaParameterService.user && (
          <layout-grid-cell data-span='12'>
            <CreateMetaParameter
              user={createMetaParameterService.user}
              onCancel={createMetaParameterService.cancelCreate}
            />
          </layout-grid-cell>
        )}
        <layout-grid-cell data-span='12'>
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
              <TableColumnHeader />
            </TableHeader>
            <TableBody>
              {userMetaParametersResource.data.map(param => (
                <MetadataParam
                  key={param.id}
                  param={param}
                  selectable={isLocalProviderAvailable}
                />
              ))}
            </TableBody>
          </Table>
          <Loader state={userMetaParametersResource} overlay />
        </layout-grid-cell>
      </layout-grid-inner>
    </layout-grid>
  );
});
