/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css, use } from 'reshadow';

import { AdministrationTools, AdministrationItemContentProps } from '@cloudbeaver/core-administration';
import { Loader, IconButton, Button } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionsAdministrationController } from './ConnectionsAdministrationController';
import { ConnectionsTable } from './ConnectionsTable/ConnectionsTable';
import { DatabasesSearch } from './DatabasesSearch';

const styles = composes(
  css`
    AdministrationTools, layout-grid-cell {
      composes: theme-background-surface theme-text-on-surface from global;
    }

    layout-grid-cell {
      composes: theme-border-color-background from global;
    }
  `,
  css`
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
      display: flex;
      padding: 0 16px;
      align-items: center;
    }

    IconButton {
      height: 32px;
      width: 32px;
      margin-right: 16px;
    }

    actions {
      padding: 0 12px;
      padding-right: 24px;
    }
  `
);

export const ConnectionsAdministration = observer(function ConnectionsAdministration({
  configurationWizard,
}: AdministrationItemContentProps) {
  const translate = useTranslate();
  const controller = useController(ConnectionsAdministrationController);

  if (configurationWizard && !controller.isSearching) {
    controller.findDatabase();
    controller.search();
  }

  return styled(useStyles(styles))(
    <layout-grid as="div">
      <layout-grid-inner as="div">
        <layout-grid-cell as='div' {...use({ span: 12 })}>
          <AdministrationTools>
            <actions as='div'>
              <Button
                type="button"
                disabled={controller.isLoading}
                mod={['outlined']}
                onClick={controller.findDatabase}
              >
                {translate('connections_connection_edit_search')}
              </Button>
            </actions>
            <IconButton name="add" viewBox="0 0 28 28" onClick={controller.create} />
            <IconButton name="trash" viewBox="0 0 28 28" onClick={controller.delete} />
            <IconButton name="reload" viewBox="0 0 28 28" onClick={controller.update} />
          </AdministrationTools>
          {controller.isSearching && (
            <DatabasesSearch
              hosts={controller.hosts}
              onChange={controller.onSearchChange}
              onSearch={controller.search}
              disabled={controller.isLoading}
            />
          )}
          <ConnectionsTable
            connections={controller.connections}
            findConnections={controller.findConnections}
            selectedItems={controller.selectedItems}
            expandedItems={controller.expandedItems}
          />
          {controller.isLoading && <Loader overlay/>}
        </layout-grid-cell>
      </layout-grid-inner>
    </layout-grid>
  );
});
