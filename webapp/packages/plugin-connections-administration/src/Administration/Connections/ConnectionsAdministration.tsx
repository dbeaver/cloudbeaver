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
  GroupTitle,
  InfoItem,
  Loader,
  s,
  SContext,
  type StyleRegistry,
  ToolsAction,
  ToolsPanel,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';

import ConnectionsAdministrationStyle from './ConnectionsAdministration.module.css';
import { ConnectionsTable } from './ConnectionsTable/ConnectionsTable.js';
import { useConnectionsTable } from './ConnectionsTable/useConnectionsTable.js';
import { CreateConnection } from './CreateConnection/CreateConnection.js';

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
  const style = useS(ConnectionsAdministrationStyle);
  const translate = useTranslate();

  const state = useConnectionsTable();

  return (
    <ColoredContainer vertical wrap parent gap>
      <Group keepSize dense>
        <InfoItem info={translate('connections_templates_deprecated_message')} />
      </Group>
      <Group box keepSize>
        <ToolsPanel rounded>
          <ToolsAction
            title={translate('connections_administration_tools_refresh_tooltip')}
            icon="refresh"
            viewBox="0 0 24 24"
            disabled={state.loading}
            onClick={state.update}
          >
            {translate('ui_refresh')}
          </ToolsAction>
          <ToolsAction
            title={translate('connections_administration_tools_delete_tooltip')}
            icon="trash"
            viewBox="0 0 24 24"
            disabled={!state.table.itemsSelected || state.loading}
            onClick={state.delete}
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
            <Loader loading={state.loading} overlay>
              <ConnectionsTable state={state} />
            </Loader>
          </SContext>
        </Group>
      </Container>
    </ColoredContainer>
  );
});
