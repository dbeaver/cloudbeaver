/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Loader } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { SQLCodeEditorLoader } from '@cloudbeaver/plugin-sql-editor';

import { DdlViewerController } from './DdlViewerController';

const styles = css`
  wrapper {
    flex: 1;
    overflow: auto;
    composes: theme-typography--body1 from global;
  }
  SQLCodeEditorLoader {
    height: 100%;
  }
`;

export interface DdlViewerTabPanelProps {
  nodeId: string;
}

export const ddlViewer = (nodeId: string) => (<DdlViewerTabPanel nodeId={nodeId} />);

const DdlViewerTabPanel: React.FC<DdlViewerTabPanelProps> = observer(function DdlViewerTabPanel({ nodeId }) {
  const controller = useController(DdlViewerController, nodeId);

  if (controller.isLoading) {
    return <Loader />;
  }

  return styled(styles)(
    <wrapper>
      {controller.metadata && (
        <SQLCodeEditorLoader
          bindings={{
            autoCursor: false,
            options: {
              lineWrapping: false,
            },
          }}
          value={controller.metadata}
          dialect={controller.dialect}
          readonly
        />
      )}
    </wrapper>
  );
});
