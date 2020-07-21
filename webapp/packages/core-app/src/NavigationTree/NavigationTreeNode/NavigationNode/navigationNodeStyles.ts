/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes } from '@cloudbeaver/core-theming';

export const navigationNodeStyles = composes(
  css`
    control {
      composes: theme-ripple theme-ripple-selectable from global;
    }
  `,
  css`
    node {
      box-sizing: border-box;
      width: fit-content;
      min-width: 100%;
      height: 20px;

      &[use|isExpanded] {
        & + nested {
          display: block;
        }

        & arrow Icon {
          height: 16px;
          width: 16px;
          transform: rotate(90deg);
        }
      }

      & control {
        display: flex;
        align-items: center;
        padding: 0px 5px;
        user-select: none;
        white-space: nowrap;
        height: inherit;
        position: initial;
        outline: none;
        
        &:hover > portal, 
        &[aria-selected=true] > portal {
          visibility: visible;
        }

        &::before {
          left: 0;
          top: auto;
          height: inherit;
          width: 100%;
        }
      }
    }

    arrow {
      cursor: pointer;
      opacity: 0.5;
      width: 16px;
      height: 16px;

      &[hidden] + icon {
        margin-left: 20px;
      }
    }

    icon {
      margin-left: 4px;
      width: 16px;
      height: 16px;

      & StaticImage {
        height: 100%;
      }
    }

    name {
      margin-left: 4px;
      padding-right: 16px;
    }

    portal {
      margin-left: auto;
      margin-right: 16px;
      visibility: hidden;
    }

    nested {
      padding: 2px 0;
      padding-left: 16px;
      display: none;
    }
  `
);
