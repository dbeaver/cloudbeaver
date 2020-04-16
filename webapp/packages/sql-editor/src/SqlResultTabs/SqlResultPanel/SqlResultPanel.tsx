/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Button } from '@dbeaver/core/blocks';
import { useController } from '@dbeaver/core/di';
import { TableViewer } from '@dbeaver/data-viewer-plugin';

import { ISqlResultPanelParams } from '../../ISqlEditorTabState';
import { EPanelState, SqlResultPanelController } from './SqlResultPanelController';


const style = css`
  result-panel {
    display: flex;
    flex: 1;
  }
  error, messages {
    padding: 12px
  }
  error-text {
    overflow: auto;
    max-height: 96px;
    margin-bottom: 16px
  }
  wrapper {
    display: flex;
    width: 100%;
    overflow: auto;
  }
  query {
    margin-bottom: 12px;
  }
`;

type SqlResultPanelProps = {
  panelInit: ISqlResultPanelParams;
};

export const SqlResultPanel = observer(function SqlResultPanel({ panelInit }: SqlResultPanelProps) {

  const controller = useController(SqlResultPanelController, panelInit);

  return styled(style)(
    <result-panel as="div">
      { controller.state === EPanelState.ERROR && (
        <error as="div">
          <error-text as="div">
            {controller.errorMessage}
          </error-text>
          {controller.hasDetails && (
            <Button type='button' mod={['outlined']} onClick={controller.onShowDetails}>
              Details
            </Button>
          )}
        </error>
      )}
      { controller.state === EPanelState.MESSAGE_RESULT
        && (
          <wrapper as="div">
            <messages as="div">
              <message as="div">{controller.executionResult}</message>
              <hr/>
              <query as="pre">
                {controller.getQuery()}
              </query>
            </messages>
          </wrapper>
        )
      }
      { controller.state === EPanelState.TABLE_RESULT
        && <TableViewer tableId={controller.getTableId()}/>
      }
    </result-panel>
  );
});
