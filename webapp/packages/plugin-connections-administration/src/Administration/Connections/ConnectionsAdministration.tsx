/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { ADMINISTRATION_TOOLS_PANEL_STYLES, AdministrationItemContentProps } from '@cloudbeaver/core-administration';
import {
  BASE_CONTAINERS_STYLES,
  ColoredContainer,
  Container,
  Group,
  GroupItem,
  GroupTitle,
  Loader,
  ToolsAction,
  ToolsPanel,
  Translate,
  useResource,
  useStyles,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionInfoActiveProjectKey, ConnectionInfoResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { useController, useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';

import { ConnectionsAdministrationController } from './ConnectionsAdministrationController';
import { ConnectionsTable } from './ConnectionsTable/ConnectionsTable';
import { CreateConnection } from './CreateConnection/CreateConnection';
import { CreateConnectionService } from './CreateConnectionService';

const loaderStyle = css`
  ExceptionMessage {
    padding: 24px;
  }
`;

const styles = css`
  GroupItem {
    white-space: pre-wrap;
  }

  ToolsPanel {
    border-bottom: none;
  }
`;

export const ConnectionsAdministration = observer<AdministrationItemContentProps>(function ConnectionsAdministration({
  sub,
  param,
  configurationWizard,
}) {
  const service = useService(CreateConnectionService);
  const controller = useController(ConnectionsAdministrationController);
  const translate = useTranslate();
  const style = useStyles(BASE_CONTAINERS_STYLES, styles, ADMINISTRATION_TOOLS_PANEL_STYLES);

  useResource(ConnectionsAdministration, ConnectionInfoResource, {
    key: ConnectionInfoActiveProjectKey,
    includes: ['customIncludeOptions'],
  });
  useResource(ConnectionsAdministration, DBDriverResource, CachedMapAllKey);

  return styled(style)(
    <ColoredContainer vertical wrap parent gap>
      <Group box keepSize>
        <ToolsPanel>
          <ToolsAction
            title={translate('connections_administration_tools_add_tooltip')}
            icon="add"
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
      </Group>
      <Container overflow gap>
        {configurationWizard && (
          <Group gap>
            <GroupTitle>{translate('connections_administration_configuration_wizard_title')}</GroupTitle>
            <GroupItem>{translate('connections_administration_configuration_wizard_message')}</GroupItem>
          </Group>
        )}
        {sub && (
          <Group box>
            <CreateConnection method={param} configurationWizard={configurationWizard} />
          </Group>
        )}
        <Group box="no-overflow">
          <Loader style={loaderStyle} loading={controller.isProcessing} overlay>
            <ConnectionsTable
              keys={controller.keys}
              connections={controller.connections}
              selectedItems={controller.selectedItems}
              expandedItems={controller.expandedItems}
            />
          </Loader>
        </Group>
      </Container>
    </ColoredContainer>,
  );
});
