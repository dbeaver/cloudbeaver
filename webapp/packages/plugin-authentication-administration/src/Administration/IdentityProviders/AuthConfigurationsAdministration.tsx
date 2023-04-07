/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { AdministrationItemContentComponent, ADMINISTRATION_TOOLS_PANEL_STYLES } from '@cloudbeaver/core-administration';
import { BASE_CONTAINERS_STYLES, ToolsAction, Loader, ToolsPanel, useTranslate, useStyles, Group, Container, ColoredContainer } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';



import { AuthConfigurationsTable } from './AuthConfigurationsTable/AuthConfigurationsTable';
import { useConfigurationsTable } from './AuthConfigurationsTable/useConfigurationsTable';
import { CreateAuthConfiguration } from './CreateAuthConfiguration';
import { CreateAuthConfigurationService } from './CreateAuthConfigurationService';

const loaderStyle = css`
  ExceptionMessage {
    padding: 24px;
  }
`;

const styles = css`
  ToolsPanel {
    border-bottom: none;
  }

  content {
    display: flex;
    flex-direction: column;
    overflow: auto;
    gap: 24px;
  }

  Group {
    padding: 0;
  }
`;

export const AuthConfigurationsAdministration: AdministrationItemContentComponent = observer(function AuthConfigurationsAdministration({
  sub,
}) {
  const translate = useTranslate();
  const style = useStyles(BASE_CONTAINERS_STYLES, styles, ADMINISTRATION_TOOLS_PANEL_STYLES);
  const service = useService(CreateAuthConfigurationService);

  const table = useConfigurationsTable();

  return styled(style)(
    <>
      <ColoredContainer wrap gap parent overflow>
        <Container gap>
          <Group box>
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
          </Group>
        </Container>
        <content>
          {sub && (
            <Group>
              <CreateAuthConfiguration />
            </Group>
          )}
          <Group>
            <Loader style={loaderStyle} loading={table.processing} overlay>
              <AuthConfigurationsTable
                configurations={table.configurations}
                selectedItems={table.tableState.selected}
                expandedItems={table.tableState.expanded}
              />
            </Loader>
          </Group>
        </content>
      </ColoredContainer>
    </>
  );
});
