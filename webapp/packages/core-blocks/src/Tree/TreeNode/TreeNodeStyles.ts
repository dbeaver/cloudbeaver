/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const TREE_NODE_STYLES = css`
    TreeNodeControl {
      composes: theme-ripple theme-ripple-selectable from global;
    }
    TreeNodeNestedMessage {
      composes: theme-text-text-hint-on-light from global;
    }
    node {
      box-sizing: border-box;
      width: fit-content;
      min-width: 100%;

      &[use|expanded] {
        & > TreeNodeNested {
          display: block;
        }

        & > TreeNodeControl > TreeNodeExpand {
          transform: rotate(0deg);
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

        &[|dragging] {
          opacity: 0.6;
        }

        &[|editing]::before {
          display: none;
        }

        & > * {
          margin-right: 4px;
          margin-left: 4px;
        }
      }
    }

    TreeNodeExpand {
      display: flex;
      box-sizing: border-box;
      flex-shrink: 0;
      opacity: 0.5;
      width: 16px;
      height: 16px;
      transform: rotate(-90deg);
      & [|size='small'] {
        display: block;
      }

      & [|size='big'] {
        display: none;
      }
    }

    TreeNodeIcon {
      box-sizing: border-box;
      flex-shrink: 0;
      width: 16px;
      height: 16px;
    }

    TreeNodeName {
      box-sizing: border-box;
      padding-right: 16px;
    }

    TreeNodeFilter {
      position: relative;
      min-width: 24px;
      min-height: 24px;
      display: flex;
      align-items: center;
    }

    TreeNodeIcon, TreeNodeExpand, TreeNodeName {
      position: relative;
    }

    TreeNodeNested {
      box-sizing: border-box;
      padding: 2px 0;
      padding-left: 24px;
      display: none;

      &[root] {
        padding: 0;
        display: block;
      }

      &[expanded] {
        display: block;
      }
    }

    TreeNodeNestedMessage {
      composes: theme-typography--caption from global;
      padding: 4px 12px;
    }

    node TreeNodeControl[big] {
      height: 46px;
      padding: 0 16px;

      & TreeNodeSelect {
        margin: 3px;
      }
      & TreeNodeName {
        margin: 0;
        padding-right: 16px;
        padding-left: 16px;
      }
      & TreeNodeIcon,
      & TreeNodeExpand {
        width: 24px;
        height: 24px;
      }

      & TreeNodeExpand [|size='small'] {
        display: none;
      }

      & TreeNodeExpand [|size='big'] {
        display: block;
      }

      & > * {
        margin-right: 11px;
        margin-left: 11px;
      }
    }

    node TreeNodeControl[big] + TreeNodeNested {
      padding-left: 46px;
    }
`;
