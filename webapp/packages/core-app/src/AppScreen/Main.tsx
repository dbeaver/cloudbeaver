/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import {
  splitStyles, Split, ResizerControls, Pane,
} from '@cloudbeaver/core-blocks';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { NavigationTree } from '../NavigationTree';
import { RightArea } from './RightArea';

const mainStyles = composes(
  css`
    space {
      composes: theme-background-primary from global;
    }
    Pane {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    space {
      composes: theme-typography--body2 from global;
    }
    Pane {
      display: flex;
    }
    Pane:first-child {
      position: relative;
      flex: 0 1 auto;
    }
    Pane:last-child {
      overflow: hidden;
    }
  `
);

export function Main() {
  return styled(useStyles(mainStyles, splitStyles))(
    <space as="main">
      <Split sticky={30}>
        <Pane main={true}>
          <NavigationTree />
        </Pane>
        <ResizerControls />
        <Pane>
          <RightArea />
        </Pane>
      </Split>
    </space>
  );
}
