/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { useResource, useStyles } from '@cloudbeaver/core-blocks';
import { ConnectionDialectResource, ConnectionInfoActiveProjectKey, ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { MenuBar, MENU_BAR_DEFAULT_STYLES } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import type { NavNodeTransformViewComponent } from '@cloudbeaver/plugin-navigation-tree';
import { SQLCodeEditorLoader } from '@cloudbeaver/plugin-sql-editor';

import { TAB_PANEL_STYLES } from '../TAB_PANEL_STYLES';
import { DATA_CONTEXT_DDL_VIEWER_NODE } from './DATA_CONTEXT_DDL_VIEWER_NODE';
import { DATA_CONTEXT_DDL_VIEWER_VALUE } from './DATA_CONTEXT_DDL_VIEWER_VALUE';
import { DdlResource } from './DdlResource';
import { MENU_DDL_VIEWER_FOOTER } from './MENU_DDL_VIEWER_FOOTER';

export const DDLViewerTabPanel: NavNodeTransformViewComponent = observer(function DDLViewerTabPanel({ nodeId, folderId }) {
  const style = useStyles(TAB_PANEL_STYLES);
  const menu = useMenu({ menu: MENU_DDL_VIEWER_FOOTER });

  const ddlResource = useResource(DDLViewerTabPanel, DdlResource, nodeId);

  const connectionInfoResource = useResource(DDLViewerTabPanel, ConnectionInfoResource, ConnectionInfoActiveProjectKey);
  const connection = connectionInfoResource.resource.getConnectionForNode(nodeId);
  const connectionParam = connection ? createConnectionParam(connection) : null;
  const connectionDialectResource = useResource(DDLViewerTabPanel, ConnectionDialectResource, connectionParam);

  menu.context.set(DATA_CONTEXT_DDL_VIEWER_NODE, nodeId);
  menu.context.set(DATA_CONTEXT_DDL_VIEWER_VALUE, ddlResource.data);

  return styled(style)(
    <wrapper>
      <SQLCodeEditorLoader
        bindings={{
          autoCursor: false,
        }}
        value={ddlResource.data}
        dialect={connectionDialectResource.data}
        readonly
      />
      <MenuBar menu={menu} style={MENU_BAR_DEFAULT_STYLES} />
    </wrapper>
  );
});
