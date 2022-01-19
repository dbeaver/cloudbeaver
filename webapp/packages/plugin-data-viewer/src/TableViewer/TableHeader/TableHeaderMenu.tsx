/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { css } from 'reshadow';

import type { PlaceholderComponent } from '@cloudbeaver/core-blocks';
import { composes } from '@cloudbeaver/core-theming';
import { MenuBar } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_DATA_VIEWER_DATABASE_DATA_MODEL } from './DATA_CONTEXT_DATA_VIEWER_DATABASE_DATA_MODEL';
import { DATA_CONTEXT_DATA_VIEWER_DATABASE_DATA_MODEL_RESULT_INDEX } from './DATA_CONTEXT_DATA_VIEWER_DATABASE_DATA_MODEL_RESULT_INDEX';
import { DATA_VIEWER_DATA_MODEL_TOOLS_MENU } from './DATA_VIEWER_DATA_MODEL_TOOLS_MENU';
import type { ITableHeaderPlaceholderProps } from './TableHeaderService';

const TABLE_HEADER_MENU_BAR_STYLES = composes(
  css`
    menu-bar {
      composes: theme-border-color-background theme-background-surface theme-text-on-surface from global;
    }
    menu-bar-item {
      composes: theme-ripple from global;
    }
    MenuSeparator {
      composes: theme-border-color-background from global;
    }
`,
  css`
    menu-bar {
      composes: theme-typography--body2 from global;
      display: flex;
      margin-left: 8px;
      box-sizing: border-box;
      border: 1px solid;
      height: 24px;
    }

    menu-bar-item {
      padding: 4px;
      display: flex;
      align-items: center;
      cursor: pointer;
      background: transparent;
      outline: none;
      color: inherit;

      &[use|hidden] {
        display: none;
      }

      & IconOrImage {
          display: block;
          width: 16px;
      }

      & Loader {
          width: 16px;
      }

      & item-label {
          display: block;
          text-transform: uppercase;
          font-weight: 700;
      }

      & IconOrImage + item-label, & Loader + item-label {
          padding-left: 8px
      }
    }
    
    MenuSeparator {
      height: 100%;
      margin: 0;
      border: 0;
      border-right: 1px solid;
    }
  `
);

export const TableHeaderMenu: PlaceholderComponent<ITableHeaderPlaceholderProps> = observer(function TableHeaderMenu({
  model,
  resultIndex,
}) {
  const menu = useMenu({ menu: DATA_VIEWER_DATA_MODEL_TOOLS_MENU });

  menu.context.set(DATA_CONTEXT_DATA_VIEWER_DATABASE_DATA_MODEL, model);
  menu.context.set(DATA_CONTEXT_DATA_VIEWER_DATABASE_DATA_MODEL_RESULT_INDEX, resultIndex);

  return (
    <MenuBar menu={menu} style={TABLE_HEADER_MENU_BAR_STYLES} />
  );
});
