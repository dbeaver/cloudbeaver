/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { MenuBar } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { topMenuStyles } from '../shared/topMenuStyles';
import { TOP_APP_BAR_MENU } from './TOP_APP_BAR_MENU';

const menuStyles = css`
  Menu {
    & menu-box {
      max-height: 80vh;
      overflow: auto;
    }
    & menu-panel-item {
      overflow-x: hidden;
    }
    & menu-item-text {
      max-width: 400px;
      overflow-x: hidden;
      text-overflow: ellipsis;
    }
    & menu-trigger-text {
      text-transform: uppercase;
      font-weight: 500;
    }
  }
`;

const menuBarItemStyles = css`
  MenuBarElement {
    background: none;
    
    & menu-bar-item-label {
      text-transform: uppercase;
      font-weight: 500;
    }
  }
`;

const removeDisableEffect = css`
  Button:disabled,
  Button[aria-disabled="true"],
  MenuButton:disabled,
  MenuButton[aria-disabled="true"] {
    opacity: 1;
  }
`;

const projectsMenu = css`
  MenuItem IconOrImage {
    background-color: #fff;
    padding: 2px;
    border-radius: var(--theme-form-element-radius);
  }
  menu-trigger-icon:not([|loading]) {
    background-color: #fff;
    border-radius: 4px;
    padding: 1px;
    
    & IconOrImage {
      width: 22px;
    }
  }
`;

const styles = css`
  menu-wrapper, MenuBar {
    display: flex;
    height: 100%;
  }
  TopMenuItem {
    text-transform: uppercase;
    font-weight: 500;
    height: 100%;
  }
`;

export const MainMenu = observer(function MainMenu() {
  const menu = useMenu({ menu: TOP_APP_BAR_MENU });

  return styled(styles)(
    <menu-wrapper>
      <MenuBar
        menu={menu}
        style={[topMenuStyles, menuBarItemStyles, topMenuStyles, removeDisableEffect]}
        nestedMenuSettings={{ modal: true }}
      />
    </menu-wrapper>
  );
});
