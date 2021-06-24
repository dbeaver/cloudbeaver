/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';
import styled, { css } from 'reshadow';

import { Split, Pane, ResizerControls, splitStyles } from '@cloudbeaver/core-blocks';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { ExecutionPlanTree } from './ExecutionPlanTree';
import { ExecutionPlanTreeContext } from './ExecutionPlanTreeContext';
import { QueryPanel } from './QueryPanel';

const styles = composes(
  css`
    Pane {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    Split {
      height: 100%;
      flex-direction: column;
    }
    ResizerControls {
      width: 100%;
      height: 2px;
    }
    Pane:last-child {
      flex: 0 0 30%;
    }
  `
);

interface Props {
  query: string;
  className?: string;
}

export const ExecutionPlanTreeBlock: React.FC<Props> = function ExecutionPlanTreeBlock({ className, query }) {
  const style = useStyles(styles, splitStyles);

  return styled(style)(
    <Split className={className} sticky={30} split='horizontal' keepRatio>
      <Pane>
        <ExecutionPlanTree />
      </Pane>
      <ResizerControls />
      <Pane main>
        <QueryPanel query={query} />
      </Pane>
    </Split>
  );
};
