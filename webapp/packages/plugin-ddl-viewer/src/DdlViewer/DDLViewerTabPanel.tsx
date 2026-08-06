/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useAutoLoad, useResource, useS } from '@cloudbeaver/core-blocks';
import {
  ConnectionDialectResource,
  ConnectionInfoActiveProjectKey,
  ConnectionInfoResource,
  createConnectionParam,
} from '@cloudbeaver/core-connections';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { MenuBar, MenuBarGroupStyles, MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import type { NavNodeTransformViewComponent } from '@cloudbeaver/plugin-navigation-tree';
import { SQLCodeEditor, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-codemirror';

import { DATA_CONTEXT_DDL_VIEWER_NODE } from './DATA_CONTEXT_DDL_VIEWER_NODE.js';
import { DATA_CONTEXT_DDL_VIEWER_QUERY } from './DATA_CONTEXT_DDL_VIEWER_QUERY.js';
import style from './DDLViewerTabPanel.module.css';
import { MENU_DDL_VIEWER_FOOTER } from './MENU_DDL_VIEWER_FOOTER.js';
import { useDdlEntityQuery } from './useDdlEntityQuery.js';

export const DDLViewerTabPanel: NavNodeTransformViewComponent = observer(function DDLViewerTabPanel({ nodeId, folderId }) {
  const styles = useS(style, MenuBarStyles, MenuBarItemStyles, MenuBarGroupStyles);
  const menu = useMenu({ menu: MENU_DDL_VIEWER_FOOTER });

  const connectionInfoResource = useResource(DDLViewerTabPanel, ConnectionInfoResource, ConnectionInfoActiveProjectKey);
  const connection = connectionInfoResource.resource.getConnectionForNode(nodeId);
  const connectionParam = connection ? createConnectionParam(connection) : null;
  const connectionDialectResource = useResource(DDLViewerTabPanel, ConnectionDialectResource, connectionParam);
  const sqlDialect = useSqlDialectExtension(connectionDialectResource.data);
  const extensions = useCodemirrorExtensions();
  if (sqlDialect) {
    extensions.set(...sqlDialect);
  }

  const ddlQueryState = useDdlEntityQuery(nodeId);

  useAutoLoad(DDLViewerTabPanel, ddlQueryState);

  const query = ddlQueryState.query ?? '';

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_DDL_VIEWER_NODE, nodeId, id);
    context.set(DATA_CONTEXT_DDL_VIEWER_QUERY, query, id);
  });

  return (
    <div className={s(styles, { wrapper: true })}>
      <SQLCodeEditor className={s(styles, { sqlCodeEditorLoader: true })} value={query} extensions={extensions} readonly />
      <MenuBar className={s(styles, { menuBar: true, floating: true, withLabel: true })} menu={menu} compact={false} />
    </div>
  );
});
