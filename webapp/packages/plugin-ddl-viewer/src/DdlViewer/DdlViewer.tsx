/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Loader } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { CodeEditor } from '@cloudbeaver/plugin-sql-editor';

import { DdlViewerController } from './DdlViewerController';

const styles = css`
  wrapper {
    flex: 1;
    overflow: auto;
  }
  CodeEditor {
    height: 100%;
  }
`;

export type DdlViewerTabPanelProps = {
  nodeId: string;
}

export const ddlViewer = (nodeId: string) => (<DdlViewerTabPanel nodeId={nodeId}/>);

const DdlViewerTabPanel = observer(function DdlViewerTabPanel(props: DdlViewerTabPanelProps) {
  const controller = useController(DdlViewerController, props.nodeId);

  if (controller.isLoading) {
    return <Loader />;
  }

  return styled(styles)(
    <wrapper as="div">
      {controller.metadata && (
        <CodeEditor
          value={controller.metadata}
          readonly={true}
          dialect={controller.dialect}/>
      )}
    </wrapper>
  );
});
