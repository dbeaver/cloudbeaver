/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import { s, useResource, useS } from '@cloudbeaver/core-blocks';
import {
  ConnectionDialectResource,
  ConnectionInfoActiveProjectKey,
  ConnectionInfoResource,
  createConnectionParam,
} from '@cloudbeaver/core-connections';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { MenuBar, MenuBarGroupStyles, MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import type { NavNodeTransformViewComponent } from '@cloudbeaver/plugin-navigation-tree';
import { SQLCodeEditor, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-codemirror';
import { DDL_GENERATOR_ID, getDefaultQueryGeneratorOptions, SqlGeneratorsResource } from '@cloudbeaver/core-sql-generator';

import { DATA_CONTEXT_DDL_VIEWER_FULL_DDL } from './DATA_CONTEXT_DDL_VIEWER_FULL_DDL.js';
import { DATA_CONTEXT_DDL_VIEWER_NODE } from './DATA_CONTEXT_DDL_VIEWER_NODE.js';
import { DATA_CONTEXT_DDL_VIEWER_VALUE } from './DATA_CONTEXT_DDL_VIEWER_VALUE.js';
import style from './DDLViewerTabPanel.module.css';
import { MENU_DDL_VIEWER_FOOTER } from './MENU_DDL_VIEWER_FOOTER.js';

export const DDLViewerTabPanel: NavNodeTransformViewComponent = observer(function DDLViewerTabPanel({ nodeId, folderId }) {
  const styles = useS(style, MenuBarStyles, MenuBarItemStyles, MenuBarGroupStyles);
  const menu = useMenu({ menu: MENU_DDL_VIEWER_FOOTER });
  const notificationService = useService(NotificationService);

  const [isFullDdl, setIsFullDdl] = useState(false);
  const [query, setQuery] = useState<string>('');
  const [ddlLoading, setDdlLoading] = useState(false);

  const sqlGeneratorsResource = useResource(DDLViewerTabPanel, SqlGeneratorsResource, nodeId);
  const ddlGenerator = sqlGeneratorsResource.data?.find(generator => generator.id.toLowerCase().includes(DDL_GENERATOR_ID.toLowerCase()));

  const connectionInfoResource = useResource(DDLViewerTabPanel, ConnectionInfoResource, ConnectionInfoActiveProjectKey);
  const connection = connectionInfoResource.resource.getConnectionForNode(nodeId);
  const connectionParam = connection ? createConnectionParam(connection) : null;
  const connectionDialectResource = useResource(DDLViewerTabPanel, ConnectionDialectResource, connectionParam);
  const sqlDialect = useSqlDialectExtension(connectionDialectResource.data);
  const extensions = useCodemirrorExtensions();
  if (sqlDialect) {
    extensions.set(...sqlDialect);
  }

  async function loadDdl(showFullDdl: boolean) {
    if (!ddlGenerator) {
      return;
    }

    setDdlLoading(true);
    try {
      const newQuery = await sqlGeneratorsResource.resource.generateEntityQuery(ddlGenerator.id, nodeId, {
        ...getDefaultQueryGeneratorOptions(),
        showFullDdl,
      });
      setQuery(newQuery);
    } catch (error: any) {
      notificationService.logException(error, 'plugin_ddl_viewer_full_ddl_error_title');
    } finally {
      setDdlLoading(false);
    }
  }

  useEffect(() => {
    if (ddlGenerator) {
      loadDdl(isFullDdl);
    }
  }, [nodeId, !!ddlGenerator]);

  async function handleFullDdlChange(value: boolean) {
    setIsFullDdl(value);
    await loadDdl(value);
  }

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_DDL_VIEWER_NODE, nodeId, id);
    context.set(DATA_CONTEXT_DDL_VIEWER_VALUE, query, id);

    if (ddlGenerator) {
      context.set(DATA_CONTEXT_DDL_VIEWER_FULL_DDL, { value: isFullDdl, loading: ddlLoading, onChange: handleFullDdlChange }, id);
    }
  });

  return (
    <div className={s(styles, { wrapper: true })}>
      <SQLCodeEditor className={s(styles, { sqlCodeEditorLoader: true })} value={query} extensions={extensions} readonly />
      <MenuBar className={s(styles, { menuBar: true, floating: true, withLabel: true })} menu={menu} compact={false} />
    </div>
  );
});
