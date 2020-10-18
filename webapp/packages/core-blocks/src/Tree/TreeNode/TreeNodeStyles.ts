/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes } from '@cloudbeaver/core-theming';

export const TREE_NODE_STYLES = composes(
  css`
    TreeNodeControl {
      composes: theme-ripple theme-ripple-selectable from global;
    }
  `,
  css`
    node {
      box-sizing: border-box;
      width: fit-content;
      min-width: 100%;

      &[use|expanded] {
        & > TreeNodeNested {
          display: block;
        }

        & > TreeNodeControl > TreeNodeExpand {
          transform: rotate(90deg);
        }
      }

      & TreeNodeControl {
        box-sizing: border-box;
        height: 20px;
        display: flex;
        align-items: center;
        padding: 0px 5px;
        user-select: none;
        white-space: nowrap;
        position: initial;
        outline: none;

        &::before {
          left: 0;
          top: auto;
          height: inherit;
          width: 100%;
        }
      }
    }

    TreeNodeExpand {
      box-sizing: border-box;
      flex-shrink: 0;
      opacity: 0.5;
      width: 16px;
      height: 16px;
    }

    TreeNodeIcon {
      box-sizing: border-box;
      flex-shrink: 0;
      margin-left: 4px;
      width: 16px;
      height: 16px;
    }

    TreeNodeName {
      box-sizing: border-box;
      margin-left: 4px;
      padding-right: 16px;
    }

    TreeNodeNested {
      box-sizing: border-box;
      padding: 2px 0;
      padding-left: 20px;
      display: none;
    }
  `
);
