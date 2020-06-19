/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes } from '@cloudbeaver/core-theming';

export const SNACKBAR_STYLES = composes(
  css`
    notification {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    notification {
      composes: theme-elevation-z5 from global;
      position: relative;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow: hidden;
      width: 500px;
      margin-bottom: 16px;
      margin-left: 16px;
      padding: 18px 24px;
      line-height: 1.5;
      opacity: 0;
      border-radius: 4px;
      transition: opacity 0.3s ease-in-out, transform 0.5s ease-in-out;
      transform: translateX(-100%);

      &[use|mounted] {
        transform: translateX(0);
        opacity: 1;
      }
      &[use|closing] {
        opacity: 0;
      }
    }

    notification-header {
      display: flex;
    }

    message {
      flex: 1;
      overflow: auto;
      max-height: 200px;
      padding-right: 24px;
      word-break: break-word;
    }

    NotificationMark {
      display: block;
      box-sizing: border-box;
      overflow: hidden;
      width: 24px;
      height: 24px;
      font-size: 24px;
      font-style: normal;
      line-height: 0;
      text-align: center;
      text-transform: none;
      vertical-align: -0.125em;
      text-rendering: optimizeLegibility;

      &[type='Info'] :global(svg) {
        fill: #52c41a !important;
      }
      & :global(svg) {
        fill: #ed3b26 !important;
      }
    }

    NotificationMark + message {
      padding-left: 24px;
    }

    actions {
      display: flex;

      &:not(:empty) {
        margin-top: 24px;
      }

      & Button {
        margin-left: 16px;

        &:first-child {
          margin-left: auto;
        }
      }
    }
    IconButton {
      color: rgba(0, 0, 0, 0.45);
    }
  `
);
