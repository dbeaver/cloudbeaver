/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const slideBoxStyles = css`
    SlideBox {
      overflow: hidden;
      white-space: nowrap;

      & SlideElement {
        width: 100%;
        height: 100%;
        display: inline-block;
        vertical-align:top;
        white-space: normal;
        transition: transform cubic-bezier(0.4, 0.0, 0.2, 1) 0.6s;
        transform: translateX(calc(-100% + 120px));

        &:first-child {
          width: calc(100% - 120px);
        }
      }

      & SlideOverlay {
        position: absolute;
        cursor: pointer;
        display: flex;
        align-items: center;
        width: 0;
        height: 0;
        top: 0;
        left: 0;
        background: rgb(0 0 0 / 0%);
        transition: background cubic-bezier(0.4, 0.0, 0.2, 1) 0.6s;
      }

      &[open] {
        & SlideOverlay {
          width: 100%;
          height: 100%;
          background: rgb(0 0 0 / 35%);

          & > :global(div) {
            display: flex;
          }
        }
        & SlideElement {
          transform: translateX(0%);
        }
      }
    }
  `;
