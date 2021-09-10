/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import type { NavNodeTransformViewComponent } from '@cloudbeaver/core-app';
import { Loader } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { SQLCodeEditorLoader } from '@cloudbeaver/plugin-sql-editor';

import { DdlViewerController } from './DdlViewerController';

const styles = css`
  wrapper {
    flex: 1;
    display: flex;
    overflow: auto;
    composes: theme-typography--body1 from global;
  }
  SQLCodeEditorLoader {
    height: 100%;
    flex: 1;
    overflow: auto;
  }
`;

export const DDLViewerTabPanel: NavNodeTransformViewComponent = observer(function DDLViewerTabPanel({ nodeId, folderId }) {
  const controller = useController(DdlViewerController, nodeId);

  useEffect(() => {
    controller.load();
  });
  // TODO: not triggered in switch case with lazy
  // useTab(folderId, () => controller.load());

  if (controller.isLoading) {
    return <Loader />;
  }

  return styled(styles)(
    <wrapper>
      <SQLCodeEditorLoader
        bindings={{
          autoCursor: false,
        }}
        value={controller.metadata}
        dialect={controller.dialect}
        readonly
      />
    </wrapper>
  );
});
