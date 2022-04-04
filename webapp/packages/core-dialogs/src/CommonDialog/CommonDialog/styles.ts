/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import type { ThemeSelector } from '@cloudbeaver/core-theming';

export const commonDialogThemeStyle: ThemeSelector = async theme => {
  let styles: any;

  switch (theme) {
    case 'dark':
      styles = await import('./themes/dark.module.scss');
      break;
    default:
      styles = await import('./themes/light.module.scss');
      break;
  }

  return [styles.default];
};

export const commonDialogBaseStyle = css`
    dialog {
      composes: theme-background-surface theme-text-on-surface theme-elevation-z10 from global;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      margin: 0;
      border: none;
      height: auto;
      max-height: 100%;
      max-width: 748px;
      border-radius: 0.25rem;
      padding: 0px;

      &[|size=small] {
        min-width: 404px;
        min-height: 262px;
        max-height: max(100vh - 48px, 262px);

        &[|fixedSize] {
          width: 404px;
          height: 262px;
        }
        &[|fixedWidth] {
          width: 404px;
        }
      }
      &[|size=medium] {
        min-width: 576px;
        min-height: 374px;
        max-height: max(100vh - 48px, 374px);

        &[|fixedSize] {
          width: 576px;
          height: 374px;
        }
        &[|fixedWidth] {
          width: 576px;
        }
      }
      &[|size=large] {
        min-width: 720px;
        min-height: 468px;
        max-height: max(100vh - 48px, 468px);

        &[|fixedSize] {
          width: 720px;
          height: 468px;
        }
        &[|fixedWidth] {
          width: 720px;
        }
      }
    }
    header, dialog-body, footer {
      flex-shrink: 0;
      padding: 24px;

      &[|no-padding] {
        padding: 0px;
      }
    }
    dialog-body {
      padding-top: 0px;
      padding-right: 0px;
    }
    footer {
      padding-top: 0px;
    }
    header {
      position: relative;
      display: grid;
      grid-template-columns: max-content 1fr;
    }
    header-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      min-height: 24px;
      overflow: hidden;
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
      &[|bigIcon] {
        width: 40px;
        height: 40px;
      }
    }
    dialog-body {
      flex: 1;
      box-sizing: content-box;
      display: flex;
      max-height: 100%;
      overflow: auto;
    }
    dialog-body-overflow-box {
      position: relative;
      flex: 1;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      overflow: auto;
      word-break: break-word;
      white-space: pre-wrap;
      padding-right: 24px;
    }
    dialog-body-content {
      flex: 1;
      position: relative;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    dialog-body[|no-padding] + footer {
      padding-top: 24px;
    }
    dialog-body[|no-padding] dialog-body-overflow-box {
      padding-right: 0;
    }
    dialog-body[|no-overflow] dialog-body-content {
      overflow: auto;
    }
    dialog-body-overflow {
      composes: branding-overflow from global;
      position: sticky;
      bottom: 0;
      left: 0;
      flex-shrink: 0;
      width: 100%;
      height: 24px;
      pointer-events: none;
    }
    h3 {
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    sub-title {
      composes: theme-typography--caption from global;
      grid-column: 2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    reject {
      cursor: pointer;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
    footer {
      display: flex;
      z-index: 0;
      box-sizing: border-box;

      &:empty {
        display: none;
      }
    }
  `;
