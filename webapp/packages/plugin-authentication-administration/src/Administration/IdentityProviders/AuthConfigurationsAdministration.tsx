/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { AdministrationItemContentComponent } from '@cloudbeaver/core-administration';
import { ColoredContainer, Container, ExceptionMessageStyles, Group, Loader, SContext, StyleRegistry, ToolsAction, ToolsPanel, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { AuthConfigurationsTable } from './AuthConfigurationsTable/AuthConfigurationsTable';
import { useConfigurationsTable } from './AuthConfigurationsTable/useConfigurationsTable';
import { CreateAuthConfiguration } from './CreateAuthConfiguration';
import { CreateAuthConfigurationService } from './CreateAuthConfigurationService';
import AuthConfigurationsAdministrationStyle from './AuthConfigurationsAdministration.m.css';

const registry: StyleRegistry = [[
  ExceptionMessageStyles,
  {
    mode: 'append',
    styles: [AuthConfigurationsAdministrationStyle],
  },
]];

export const AuthConfigurationsAdministration: AdministrationItemContentComponent = observer(function AuthConfigurationsAdministration({ sub }) {
  const translate = useTranslate();
  const service = useService(CreateAuthConfigurationService);
  const styles = useS(AuthConfigurationsAdministrationStyle);

  const table = useConfigurationsTable();

  return (
    <ColoredContainer wrap gap parent vertical>
      <Group box keepSize>
          <ToolsPanel className={s(styles, { toolsPanel: true })}>
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
      </Group>
      <Container overflow gap>
        {sub && (
          <Group box>
            <CreateAuthConfiguration />
          </Group>
        )}
        <Group boxNoOverflow>
          <SContext registry={registry}>
            <Loader loading={table.processing} overlay>
              <AuthConfigurationsTable
                configurations={table.configurations}
                selectedItems={table.tableState.selected}
                expandedItems={table.tableState.expanded}
              />
            </Loader>
          </SContext>
        </Group>
      </Container>
    </ColoredContainer>
  );
});
