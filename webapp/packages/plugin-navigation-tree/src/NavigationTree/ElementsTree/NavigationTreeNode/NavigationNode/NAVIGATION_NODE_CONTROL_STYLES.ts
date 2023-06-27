/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { css } from 'reshadow';

export const NAVIGATION_NODE_CONTROL_STYLES = css`
  TreeNodeControl:hover > portal,
  TreeNodeControl:global([aria-selected='true']) > portal,
  portal:focus-within {
    visibility: visible;
  }
  TreeNodeName {
    height: 100%;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;

    &[|editing] {
      padding: 0;
      overflow: visible;
      margin-left: 2px;
    }
  }
  portal {
    position: relative;
    box-sizing: border-box;
    margin-left: auto !important;
    margin-right: 8px !important;
    visibility: hidden;
  }
  name-box {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
