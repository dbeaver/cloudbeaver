/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { Loader, useResource, useStyles } from '@cloudbeaver/core-blocks';
import { ConnectionDialectResource, ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { MenuBar, MENU_BAR_DEFAULT_STYLES } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import type { NavNodeTransformViewComponent } from '@cloudbeaver/plugin-navigation-tree';
import { SQLCodeEditorLoader } from '@cloudbeaver/plugin-sql-editor';

import { DATA_CONTEXT_DDL_VIEWER_NODE } from '../DdlViewer/DATA_CONTEXT_DDL_VIEWER_NODE';
import { DATA_CONTEXT_DDL_VIEWER_VALUE } from '../DdlViewer/DATA_CONTEXT_DDL_VIEWER_VALUE';
import { MENU_DDL_VIEWER_FOOTER } from '../DdlViewer/MENU_DDL_VIEWER_FOOTER';
import { TAB_PANEL_STYLES } from '../TAB_PANEL_STYLES';
import { ExtendedDDLResource } from './ExtendedDDLResource';

export const ExtendedDDLViewerTabPanel: NavNodeTransformViewComponent = observer(function ExtendedDDLViewerTabPanel({
  nodeId, folderId
}) {
  const style = useStyles(TAB_PANEL_STYLES);
  const menu = useMenu({ menu: MENU_DDL_VIEWER_FOOTER });

  const connectionInfoResource = useService(ConnectionInfoResource);

  const extendedDDLResource = useResource(ExtendedDDLViewerTabPanel, ExtendedDDLResource, nodeId);

  const connection = connectionInfoResource.getConnectionForNode(nodeId);
  const connectionParam = connection ? createConnectionParam(connection) : null;

  const connectionDialectResource = useResource(ExtendedDDLViewerTabPanel, ConnectionDialectResource, connectionParam);

  if (extendedDDLResource.isLoading()) {
    return <Loader />;
  }

  menu.context.set(DATA_CONTEXT_DDL_VIEWER_NODE, nodeId);
  menu.context.set(DATA_CONTEXT_DDL_VIEWER_VALUE, extendedDDLResource.data);

  return styled(style)(
    <wrapper>
      <SQLCodeEditorLoader
        bindings={{
          autoCursor: false,
        }}
        value={extendedDDLResource.data}
        dialect={connectionDialectResource.data}
        readonly
      />
      <MenuBar menu={menu} style={MENU_BAR_DEFAULT_STYLES} />
    </wrapper>
  );
});
