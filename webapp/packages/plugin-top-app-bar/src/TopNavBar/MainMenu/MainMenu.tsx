/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useService } from '@cloudbeaver/core-di';

import { TopMenuItem } from '../shared/TopMenuItem';
import { MainMenuService } from './MainMenuService';

const styles = css`
  menu-wrapper {
    display: flex;
    height: 100%;
    background: #338ecc;
  }
  TopMenuItem {
    text-transform: uppercase;
    font-weight: 700;
    height: 100%;
  }
`;

export const MainMenu = observer(function MainMenu() {
  const mainMenuService = useService(MainMenuService);

  return styled(styles)(
    <menu-wrapper>
      {mainMenuService.getMainMenu().map((topItem, i) => (
        <TopMenuItem key={i} menuItem={topItem} />
      ))}
    </menu-wrapper>
  );
});
