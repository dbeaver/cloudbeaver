/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const splitStyles = css`
    space {
      display: flex;
      flex-direction: row;
      flex: 1;
      overflow: hidden;
    }
    Split {
      display: flex;
      flex-direction: row;
      flex: 1;
      overflow: hidden;
      z-index: 0;
    }
    Pane {
      flex: 1 1 0%;
      overflow: auto;
      z-index: 0;
    }

    ResizerControls {
      composes: theme-background-background theme-text-on-secondary from global;
      position: relative;
      flex: 0 1 auto;
      width: 2px;
      cursor: ew-resize;
      user-select: none;
      z-index: 1;
      transition: background-color 0.3s ease-in-out;

      &:hover {
        background-color: var(--theme-primary);
      }
    }

    ResizerControls:before {
      content: ' ';
      position: absolute;
      width: 4px;
      height: 100%;
      top: 0;
      left: -1px;
      cursor: ew-resize;
      box-sizing: border-box;
    }
  `;

export const splitHorizontalStyles = css`
  space {
    height: 100%;
  }
  Split {
    flex-direction: column;
    height: 100%;
  }

  ResizerControls {
    position: relative;
    cursor: ns-resize;
    height: 2px;
    width: initial;
  }

  ResizerControls:before {
    height: 4px;
    width: 100%;
    top: -1px;
    left: 0;
    cursor: ns-resize;
  }
`;
