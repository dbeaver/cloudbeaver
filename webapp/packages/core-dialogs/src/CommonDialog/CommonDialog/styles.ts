/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes, ThemeSelector } from '@cloudbeaver/core-theming';

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

export const commonDialogBaseStyle = composes(
  css`
    dialog {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    dialog {
      composes: theme-elevation-z10 from global;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      padding: 24px;
      margin: 0;
      border: none;
      height: auto;
      min-width: 748px;
      max-height: 100%;
      border-radius: 0.25rem;
    }
    header {
      position: relative;
      display: grid;
      grid-template-columns: max-content 1fr;
      margin-bottom: 24px;
    }
    header-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      min-height: 24px;
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
      position: relative;
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      flex: 1;
      overflow: auto;
    }
    dialog-body-content {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow: auto;
      min-height: 80px;
      max-width: 748px;
      max-height: 100%;
      padding-bottom: 24px;
    }
    dialog-body-overflow {
      position: absolute;
      flex-shrink: 0;
      bottom: 0;
      width: 100%;
      height: 24px;
      pointer-events: none;
    }
    h3 {
      margin: 0;
    }
    sub-title {
      composes: theme-typography--caption from global;
      grid-column: 2;
    }
    reject {
      cursor: pointer;
      width: 18px;
      height: 18px;
    }
    footer {
      display: flex;
      z-index: 0;
      box-sizing: border-box;
      margin-top: 16px;

      &:empty {
        display: none;
      }
    }
  `
);
