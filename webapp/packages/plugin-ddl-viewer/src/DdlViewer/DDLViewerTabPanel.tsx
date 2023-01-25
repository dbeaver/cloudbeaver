/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled from 'reshadow';

import { Loader, useStyles } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { MenuBar, MENU_BAR_DEFAULT_STYLES } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import type { NavNodeTransformViewComponent } from '@cloudbeaver/plugin-navigation-tree';
import { SQLCodeEditorLoader } from '@cloudbeaver/plugin-sql-editor';

import { TAB_PANEL_STYLES } from '../TAB_PANEL_STYLES';
import { DATA_CONTEXT_DDL_VIEWER_NODE } from './DATA_CONTEXT_DDL_VIEWER_NODE';
import { DATA_CONTEXT_DDL_VIEWER_VALUE } from './DATA_CONTEXT_DDL_VIEWER_VALUE';
import { DdlViewerController } from './DdlViewerController';
import { MENU_DDL_VIEWER_FOOTER } from './MENU_DDL_VIEWER_FOOTER';

export const DDLViewerTabPanel: NavNodeTransformViewComponent = observer(function DDLViewerTabPanel({ nodeId, folderId }) {
  const style = useStyles(TAB_PANEL_STYLES);
  const controller = useController(DdlViewerController, nodeId);
  const menu = useMenu({ menu: MENU_DDL_VIEWER_FOOTER });

  useEffect(() => {
    controller.load();
  });
  // TODO: not triggered in switch case with lazy
  // useTab(folderId, () => controller.load());

  if (controller.isLoading) {
    return <Loader />;
  }

  menu.context.set(DATA_CONTEXT_DDL_VIEWER_NODE, nodeId);
  menu.context.set(DATA_CONTEXT_DDL_VIEWER_VALUE, controller.metadata);

  return styled(style)(
    <wrapper>
      <SQLCodeEditorLoader
        bindings={{
          autoCursor: false,
        }}
        value={controller.metadata}
        dialect={controller.dialect}
        readonly
      />
      <MenuBar menu={menu} style={MENU_BAR_DEFAULT_STYLES} />
    </wrapper>
  );
});
