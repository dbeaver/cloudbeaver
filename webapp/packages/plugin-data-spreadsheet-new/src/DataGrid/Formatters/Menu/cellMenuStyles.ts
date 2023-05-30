/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { css } from 'reshadow';

export const cellMenuStyles = css`
  IconOrImage {
    composes: theme-text-primary from global;
  }
  :global(.rdg-cell):not(:global([aria-selected='true'])):not(:hover) cell-menu {
    display: none;
  }
  cell-menu {
    flex: 0 0 auto;
    height: var(--rdg-row-height);
    position: absolute;
    top: 0px;
    right: 0px;
  }
  MenuTrigger {
    padding: 0 8px;
    height: 100%;

    &:before {
      display: none;
    }

    & Icon {
      cursor: pointer;
      width: 16px;
      height: 10px;
    }
  }
`;
