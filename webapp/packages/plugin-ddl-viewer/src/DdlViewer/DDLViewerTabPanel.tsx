/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useResource, useS } from '@cloudbeaver/core-blocks';
import {
  ConnectionDialectResource,
  ConnectionInfoActiveProjectKey,
  ConnectionInfoResource,
  createConnectionParam,
} from '@cloudbeaver/core-connections';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { MenuBar, MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import type { NavNodeTransformViewComponent } from '@cloudbeaver/plugin-navigation-tree';
import { SQLCodeEditorLoader, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-new';

import { DATA_CONTEXT_DDL_VIEWER_NODE } from './DATA_CONTEXT_DDL_VIEWER_NODE.js';
import { DATA_CONTEXT_DDL_VIEWER_VALUE } from './DATA_CONTEXT_DDL_VIEWER_VALUE.js';
import { DdlResource } from './DdlResource.js';
import style from './DDLViewerTabPanel.module.css';
import { MENU_DDL_VIEWER_FOOTER } from './MENU_DDL_VIEWER_FOOTER.js';

export const DDLViewerTabPanel: NavNodeTransformViewComponent = observer(function DDLViewerTabPanel({ nodeId, folderId }) {
  const styles = useS(style, MenuBarStyles, MenuBarItemStyles);
  const menu = useMenu({ menu: MENU_DDL_VIEWER_FOOTER });

  const ddlResource = useResource(DDLViewerTabPanel, DdlResource, nodeId);

  const connectionInfoResource = useResource(DDLViewerTabPanel, ConnectionInfoResource, ConnectionInfoActiveProjectKey);
  const connection = connectionInfoResource.resource.getConnectionForNode(nodeId);
  const connectionParam = connection ? createConnectionParam(connection) : null;
  const connectionDialectResource = useResource(DDLViewerTabPanel, ConnectionDialectResource, connectionParam);
  const sqlDialect = useSqlDialectExtension(connectionDialectResource.data);
  const extensions = useCodemirrorExtensions();
  extensions.set(...sqlDialect);
  const ddlData = ddlResource.data;

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_DDL_VIEWER_NODE, nodeId, id);
    context.set(DATA_CONTEXT_DDL_VIEWER_VALUE, ddlData, id);
  });

  return (
    <div className={s(styles, { wrapper: true })}>
      <SQLCodeEditorLoader className={s(styles, { sqlCodeEditorLoader: true })} value={ddlResource.data ?? ''} extensions={extensions} readonly />
      <MenuBar className={s(styles, { menuBar: true, floating: true, withLabel: true })} menu={menu} />
    </div>
  );
});
