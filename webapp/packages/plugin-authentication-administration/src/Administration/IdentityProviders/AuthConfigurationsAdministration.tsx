/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { AdministrationItemContentComponent, ADMINISTRATION_TOOLS_PANEL_STYLES } from '@cloudbeaver/core-administration';
import { BASE_CONTAINERS_STYLES, ToolsAction, Loader, ToolsPanel } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { AuthConfigurationsTable } from './AuthConfigurationsTable/AuthConfigurationsTable';
import { useConfigurationsTable } from './AuthConfigurationsTable/useConfigurationsTable';
import { CreateAuthConfiguration } from './CreateAuthConfiguration';
import { CreateAuthConfigurationService } from './CreateAuthConfigurationService';

const styles = composes(
  css`
    layout-grid-cell {
      composes: theme-background-surface theme-text-on-surface from global;
    }
    layout-grid-cell {
      composes: theme-border-color-background from global;
    }
   
`,
  css` 
    layout-grid {
      width: 100%;
      overflow: auto;
    }
    layout-grid-inner {
      min-height: 100%;
    }
    layout-grid-cell {
      position: relative;
      border: solid 1px;
    }
`);

export const AuthConfigurationsAdministration: AdministrationItemContentComponent = observer(function AuthConfigurationsAdministration({
  sub,
}) {
  const translate = useTranslate();
  const style = useStyles(styles, ADMINISTRATION_TOOLS_PANEL_STYLES, BASE_CONTAINERS_STYLES);
  const service = useService(CreateAuthConfigurationService);

  const table = useConfigurationsTable();

  return styled(style)(
    <>
      <ToolsPanel>
        <ToolsAction
          title={translate('administration_identity_providers_add_tooltip')}
          icon="add"
          viewBox="0 0 24 24"
          disabled={!!sub || table.processing}
          onClick={service.create}
        >
          {translate('ui_add')}
        </ToolsAction>
        <ToolsAction
          title={translate('administration_identity_providers_refresh_tooltip')}
          icon="refresh"
          viewBox="0 0 24 24"
          disabled={table.processing}
          onClick={table.update}
        >
          {translate('ui_refresh')}
        </ToolsAction>
        <ToolsAction
          title={translate('administration_identity_providers_delete_tooltip')}
          icon="trash"
          viewBox="0 0 24 24"
          disabled={!table.tableState.itemsSelected || table.processing}
          onClick={table.delete}
        >
          {translate('ui_delete')}
        </ToolsAction>
      </ToolsPanel>
      <layout-grid>
        <layout-grid-inner>
          {sub && (
            <layout-grid-cell {...use({ span: 12 })}>
              <CreateAuthConfiguration />
            </layout-grid-cell>
          )}
          <layout-grid-cell {...use({ span: 12 })}>
            <AuthConfigurationsTable
              configurations={table.configurations}
              selectedItems={table.tableState.selected}
              expandedItems={table.tableState.expanded}
            />
            <Loader loading={table.processing} overlay />
          </layout-grid-cell>
        </layout-grid-inner>
      </layout-grid>
    </>
  );
});
