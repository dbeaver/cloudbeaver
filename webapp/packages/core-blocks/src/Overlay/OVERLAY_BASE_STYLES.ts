/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const OVERLAY_BASE_STYLES = css`
    overlay {
      composes: theme-text-on-primary from global;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.4);

      &:not([|active]) {
        display: none;
      }
      
      &[|fill] {
        background-color: var(--theme-background-surface);
      }
    }
  
    overlay {
      margin: auto;
    }

    overlay, box {
      display: flex;
      flex-direction: column; 
      justify-content: center;
      align-items: center;
      overflow: auto;
    }

    box {
      composes: theme-background-surface theme-text-on-surface theme-elevation-z6 from global;
      border-radius: 0.25rem;
      align-items: normal;
      max-width: calc(100% - 48px);
      max-height: calc(100% - 48px);
    }

    overlay[|fill] box {
      box-shadow: none;
    }

    actions {
      gap: 16px;
      display: flex;
    }

    header, message, actions {
      flex-shrink: 0;
      padding: 24px;
    }

    message {
      padding-right: 0px;
      overflow: auto;
      flex: 1;

      &:not(:first-child) {
        padding-top: 0px;
      }
    }

    message-box {
      padding-right: 24px;
    }

    header {
      position: relative;
      display: grid;
      grid-template-columns: max-content 1fr;
      flex: 0 0 auto;
      box-sizing: border-box;
    }

    header-title, sub-title {
      max-width: 400px;
    }

    header-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      min-height: 24px;
      overflow: auto;
    }

    icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    IconOrImage {
      width: 24px;
      height: 24px;
      margin-right: 16px;
    }

    h3 {
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    sub-title {
      composes: theme-typography--caption from global;
      grid-column: 2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `;