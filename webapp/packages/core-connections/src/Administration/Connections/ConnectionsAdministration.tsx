/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css, use } from 'reshadow';

import { AdministrationTools, AdministrationItemContentProps, ADMINISTRATION_TOOLS_STYLES } from '@cloudbeaver/core-administration';
import { Loader, IconButton } from '@cloudbeaver/core-blocks';
import { useController, useService } from '@cloudbeaver/core-di';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

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

    AdministrationTools {
      border: none;
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

  return styled(useStyles(styles, ADMINISTRATION_TOOLS_STYLES))(
    <layout-grid as="div">
      <layout-grid-inner as="div">
        <layout-grid-cell as='div' {...use({ span: 12 })}>
          {configurationWizard && (
            <message-box as='div'>
              <h3><Translate token='connections_administration_configuration_wizard_title' /></h3>
              <p><Translate token='connections_administration_configuration_wizard_message' /></p>
            </message-box>
          )}
          <AdministrationTools>
            <IconButton name="add" viewBox="0 0 28 28" disabled={!!sub} onClick={service.create} />
            <IconButton name="trash" viewBox="0 0 28 28" disabled={!controller.itemsSelected} onClick={controller.delete} />
            <IconButton name="refresh-outline" viewBox="0 0 16 16" onClick={controller.update} />
          </AdministrationTools>
          {sub && (
            <CreateConnection method={param} configurationWizard={configurationWizard} />
          )}
          <ConnectionsTable
            connections={controller.connections}
            selectedItems={controller.selectedItems}
            expandedItems={controller.expandedItems}
          />
          <Loader loading={controller.isLoading} overlay />
        </layout-grid-cell>
      </layout-grid-inner>
    </layout-grid>
  );
});
