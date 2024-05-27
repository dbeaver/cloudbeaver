/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { AdministrationItemContentProps } from '@cloudbeaver/core-administration';
import {
  ColoredContainer,
  Container,
  ExceptionMessageStyles,
  Group,
  GroupItem,
  GroupSubTitle,
  GroupTitle,
  Loader,
  s,
  SContext,
  StyleRegistry,
  ToolsAction,
  ToolsPanel,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionInfoActiveProjectKey, ConnectionInfoResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { useController, useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';

import ConnectionsAdministrationStyle from './ConnectionsAdministration.m.css';
import { ConnectionsAdministrationController } from './ConnectionsAdministrationController';
import { ConnectionsTable } from './ConnectionsTable/ConnectionsTable';
import { CreateConnection } from './CreateConnection/CreateConnection';
import { CreateConnectionService } from './CreateConnectionService';

const registry: StyleRegistry = [
  [
    ExceptionMessageStyles,
    {
      mode: 'append',
      styles: [ConnectionsAdministrationStyle],
    },
  ],
];

export const ConnectionsAdministration = observer<AdministrationItemContentProps>(function ConnectionsAdministration({
  sub,
  param,
  configurationWizard,
}) {
  const service = useService(CreateConnectionService);
  const controller = useController(ConnectionsAdministrationController);
  const translate = useTranslate();
  const style = useS(ConnectionsAdministrationStyle);

  useResource(ConnectionsAdministration, ConnectionInfoResource, {
    key: ConnectionInfoActiveProjectKey,
    includes: ['customIncludeOptions'],
  });
  useResource(ConnectionsAdministration, DBDriverResource, CachedMapAllKey);

  return (
    <ColoredContainer vertical wrap parent gap>
      <Group keepSize dense>
        <GroupSubTitle>{translate('templates_administration_info_message')}</GroupSubTitle>
      </Group>
      <Group box keepSize>
        <ToolsPanel rounded>
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
            <GroupItem className={s(style, { groupItem: true })}>{translate('connections_administration_configuration_wizard_message')}</GroupItem>
          </Group>
        )}
        {sub && <CreateConnection method={param} configurationWizard={configurationWizard} />}
        <Group boxNoOverflow>
          <SContext registry={registry}>
            <Loader loading={controller.isProcessing} overlay>
              <ConnectionsTable
                keys={controller.keys}
                connections={controller.connections}
                selectedItems={controller.selectedItems}
                expandedItems={controller.expandedItems}
              />
            </Loader>
          </SContext>
        </Group>
      </Container>
    </ColoredContainer>
  );
});
