/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { AdministrationItemContentComponent, ADMINISTRATION_TOOLS_PANEL_STYLES } from '@cloudbeaver/core-administration';
import { BASE_CONTAINERS_STYLES, ToolsAction, Loader, ToolsPanel, useTable } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { AuthConfigurationsTable } from './AuthConfigurationsTable/AuthConfigurationsTable';
import { CreateAuthConfiguration } from './CreateAuthConfiguration';
import { CreateAuthConfigurationService } from './CreateAuthConfigurationService';
import { useConfigurationsTable } from './useConfigurationsTable';

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
      flex: 1;
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

  const tableState = useTable();
  const configurationsTableState = useConfigurationsTable(tableState);

  return styled(style)(
    <>
      <ToolsPanel>
        <ToolsAction
          title={translate('administration_identity_providers_add_tooltip')}
          icon="add"
          viewBox="0 0 24 24"
          disabled={!!sub || configurationsTableState.processing}
          onClick={service.create}
        >
          {translate('ui_add')}
        </ToolsAction>
        <ToolsAction
          title={translate('administration_identity_providers_refresh_tooltip')}
          icon="refresh"
          viewBox="0 0 24 24"
          disabled={configurationsTableState.processing}
          onClick={configurationsTableState.update}
        >
          {translate('ui_refresh')}
        </ToolsAction>
        <ToolsAction
          title={translate('administration_identity_providers_delete_tooltip')}
          icon="trash"
          viewBox="0 0 24 24"
          disabled={!tableState.itemsSelected || configurationsTableState.processing}
          onClick={configurationsTableState.delete}
        >
          {translate('ui_delete')}
        </ToolsAction>
      </ToolsPanel>
      <layout-grid>
        <layout-grid-inner>
          <layout-grid-cell {...use({ span: 12 })}>
            <>
              {sub && (
                <CreateAuthConfiguration />
              )}
              <AuthConfigurationsTable
                configurations={configurationsTableState.configurations}
                selectedItems={tableState.selected}
                expandedItems={tableState.expanded}
              />
              <Loader loading={configurationsTableState.processing} overlay />
            </>
          </layout-grid-cell>
        </layout-grid-inner>
      </layout-grid>
    </>
  );
});
