/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
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
      transition: box-shadow 0.3s ease-in-out;

      &:hover {
        box-shadow: 0px 3px 3px -2px rgb(0 0 0 / 20%), 0px 3px 4px 0px rgb(0 0 0 / 14%), 0px 1px 8px 0px rgb(0 0 0 / 12%);
      }
    }

    ResizerControls:before {
      content: ' ';
      position: absolute;
      width: 12px;
      height: 100%;
      top: 0;
      left: -5px;
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
    height: 12px;
    width: 100%;
    top: -5px;
    left: 0;
    cursor: ns-resize;
  }
`;
