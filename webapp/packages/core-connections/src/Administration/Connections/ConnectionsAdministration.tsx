/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { AdministrationItemContentProps, ADMINISTRATION_TOOLS_PANEL_STYLES } from '@cloudbeaver/core-administration';
import { Loader, useMapResource, ToolsAction, ToolsPanel } from '@cloudbeaver/core-blocks';
import { useController, useService } from '@cloudbeaver/core-di';
import { Translate, useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionsResource } from '../ConnectionsResource';
import { ConnectionsAdministrationController } from './ConnectionsAdministrationController';
import { ConnectionsTable } from './ConnectionsTable/ConnectionsTable';
import { CreateConnection } from './CreateConnection/CreateConnection';
import { CreateConnectionService } from './CreateConnectionService';

const styles = composes(
  css`
    layout-grid-cell {
      composes: theme-background-surface theme-text-on-surface from global;
    }

    layout-grid-cell, message-box {
      composes: theme-border-color-background from global;
    }
  `,
  css`
    message-box {
      padding: 16px 24px;
      border-bottom: solid 1px;
    }

    layout-grid {
      overflow: auto;
      width: 100%;
      flex: 1;
    }

    layout-grid-inner {
      min-height: 100%;
    }

    layout-grid-cell {
      position: relative;
      border: solid 1px;
    }

    actions {
      padding: 0 12px;
      padding-right: 24px;
    }
    
    p {
      line-height: 2;
      white-space: pre-wrap;
    }
  `
);

export const ConnectionsAdministration: React.FC<AdministrationItemContentProps> = observer(function ConnectionsAdministration({
  sub,
  param,
  configurationWizard,
}) {
  const service = useService(CreateConnectionService);
  const controller = useController(ConnectionsAdministrationController);
  const translate = useTranslate();

  useMapResource(ConnectionsResource, ConnectionsResource.keyAll);

  return styled(useStyles(styles, ADMINISTRATION_TOOLS_PANEL_STYLES))(
    <>
      <ToolsPanel>
        <ToolsAction
          title={translate('connections_administration_tools_add_tooltip')}
          icon='add'
          viewBox="0 0 24 24"
          disabled={!!sub || controller.isProcessing}
          onClick={service.create}
        >
          {translate('ui_add')}
        </ToolsAction>
        <ToolsAction
          title={translate('connections_administration_tools_refresh_tooltip')}
          icon="refresh"
          viewBox="0 0 24 24"
          disabled={controller.isProcessing}
          onClick={controller.update}
        >
          {translate('ui_refresh')}
        </ToolsAction>
        <ToolsAction
          title={translate('connections_administration_tools_delete_tooltip')}
          icon="trash"
          viewBox="0 0 24 24"
          disabled={!controller.itemsSelected || controller.isProcessing}
          onClick={controller.delete}
        >
          {translate('ui_delete')}
        </ToolsAction>
      </ToolsPanel>
      <layout-grid>
        <layout-grid-inner>
          <layout-grid-cell {...use({ span: 12 })}>
            {configurationWizard && (
              <message-box>
                <h3><Translate token='connections_administration_configuration_wizard_title' /></h3>
                <p><Translate token='connections_administration_configuration_wizard_message' /></p>
              </message-box>
            )}
            {sub && (
              <CreateConnection method={param} configurationWizard={configurationWizard} />
            )}
            <ConnectionsTable
              connections={controller.connections}
              selectedItems={controller.selectedItems}
              expandedItems={controller.expandedItems}
            />
            <Loader loading={controller.isProcessing} overlay />
          </layout-grid-cell>
        </layout-grid-inner>
      </layout-grid>
    </>
  );
});
