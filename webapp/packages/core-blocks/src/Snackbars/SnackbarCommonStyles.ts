/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes } from '@cloudbeaver/core-theming';

export const SNACKBAR_COMMON_STYLES = composes(
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
      box-sizing: border-box;
      overflow: hidden;
      width: 500px;
      margin-bottom: 16px;
      margin-left: 16px;
      padding: 16px 16px;
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

    notification-body {
      display: flex;
      flex-direction: column;
      flex: 1 0 0;
      & body-text-block {
        margin-top: 8px;
        padding-right: 24px;
        & message {
          font-size: 16px;
          opacity: 0.8;
          overflow: auto;
          max-height: 200px;
          margin-bottom: 8px;
          word-break: break-word;
        }
      }
    }
    
    text-block-title {
      composes: theme-typography--headline6 from global;
      max-width: 392px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      line-height: 1.55rem;
      font-weight: 700;
      margin: 0;
      padding: 0;
      margin-bottom: 8px;
    }

    notification-footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }

    footer-time {
      composes: theme-typography--caption from global;
      opacity: 0.7;
    }

    NotificationMark {
      padding-right: 12px; 
    }

    actions {
      display: flex;
      & Button {
        margin-left: 16px;
        &:first-child {
          margin-left: auto;
        }
      }
    }
    IconButton {
      position: absolute;
      top: 8px;
      right: 8px;
      height: 22px;
      width: 22px;
      &:hover {
        opacity: 0.7;
      }
    }
  `
);
