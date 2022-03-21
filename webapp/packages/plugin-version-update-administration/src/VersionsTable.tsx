/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css, use } from 'reshadow';

import { ADMINISTRATION_TOOLS_PANEL_STYLES } from '@cloudbeaver/core-administration';
import { Table, TableHeader, TableColumnHeader, TableBody, ToolsAction, ToolsPanel, Loader, useTable, BASE_LAYOUT_GRID_STYLES } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { IVersion, VersionResource } from '@cloudbeaver/core-version';

import { Version } from './Version';

const layoutStyles = css`
    layout-grid {
      width: 100%;
      overflow: auto;
    }

    layout-grid-inner {
      min-height: 100%;
    }

    layout-grid-cell {
      composes: theme-border-color-background theme-background-surface theme-text-on-surface from global;
      position: relative;
      border: solid 1px;
    }
  `;

const loaderStyle = css`
  ExceptionMessage {
    padding: 24px;
  }
`;

const styles = css`
  Table {
    width: 100%;
  }

  ToolsPanel {
    border-bottom: none;
  }
`;

interface Props {
  versions: IVersion[];
}

export const VersionsTable = observer<Props>(function VersionsTable({ versions }) {
  const translate = useTranslate();
  const style = useStyles(styles, ADMINISTRATION_TOOLS_PANEL_STYLES, layoutStyles);
  const notificationService = useService(NotificationService);
  const versionResource = useService(VersionResource);
  const table = useTable();

  const refresh = useCallback(async () => {
    try {
      await versionResource.refreshAll();
      notificationService.logSuccess({ title: 'version_update_versions_refresh_successful' });
    } catch (exception: any) {
      notificationService.logException(exception, 'version_update_versions_refresh_fail');
    }
  }, [versionResource, notificationService]);

  return styled(BASE_LAYOUT_GRID_STYLES, style)(
    <layout-grid>
      <layout-grid-inner>
        <layout-grid-cell data-span='12'>
          <ToolsPanel>
            <ToolsAction
              title={translate('ui_refresh')}
              icon="refresh"
              viewBox="0 0 24 24"
              onClick={refresh}
            >
              {translate('ui_refresh')}
            </ToolsAction>
          </ToolsPanel>
        </layout-grid-cell>
        <layout-grid-cell data-span='12' {...use({ table: true })}>
          <Loader style={loaderStyle} loading={versionResource.isLoading()} overlay>
            <Table
              selectedItems={table.selected}
              expandedItems={table.expanded}
              size='big'
            >
              <TableHeader>
                <TableColumnHeader min />
                <TableColumnHeader>{translate('version')}</TableColumnHeader>
                <TableColumnHeader>{translate('version_date')}</TableColumnHeader>
              </TableHeader>
              <TableBody>
                {versions.map(version => (
                  <Version key={version.number} version={version} />
                ))}
              </TableBody>
            </Table>
          </Loader>
        </layout-grid-cell>
      </layout-grid-inner>
    </layout-grid>
  );
});
