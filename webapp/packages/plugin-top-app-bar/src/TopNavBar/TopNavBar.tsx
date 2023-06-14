/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  CheckboxMarkupStyles,
  MenuItemElementStyles,
  MenuItemStyles,
  MenuPanelStyles,
  MenuSeparatorStyles,
  MenuStyles,
  Placeholder,
  PlaceholderContainer,
  SContext,
  StyleRegistry,
  TopAppBar,
} from '@cloudbeaver/core-blocks';
import { MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';

import TopMenuStyles from './shared/TopMenu.m.css';
import TopMenuBarStyles from './shared/TopMenuBar.m.css';
import TopMenuBarItemStyles from './shared/TopMenuBarItem.m.css';
import TopMenuCheckboxStyles from './shared/TopMenuCheckbox.m.css';
import TopMenuItemStyles from './shared/TopMenuItem.m.css';
import TopMenuItemElementStyles from './shared/TopMenuItemElement.m.css';
import TopMenuPanelStyles from './shared/TopMenuPanel.m.css';
import TopMenuSeparatorStyles from './shared/TopMenuSeparator.m.css';

interface Props {
  container: PlaceholderContainer<Record<string, any>>;
  className?: string;
}

const registry: StyleRegistry = [
  [
    MenuPanelStyles,
    {
      mode: 'append',
      styles: [TopMenuPanelStyles, TopMenuSeparatorStyles],
    },
  ],
  [
    MenuSeparatorStyles,
    {
      mode: 'append',
      styles: [TopMenuSeparatorStyles],
    },
  ],
  [
    MenuItemStyles,
    {
      mode: 'append',
      styles: [TopMenuItemStyles],
    },
  ],
  [
    MenuItemElementStyles,
    {
      mode: 'append',
      styles: [TopMenuItemElementStyles],
    },
  ],
  [
    MenuBarStyles,
    {
      mode: 'append',
      styles: [TopMenuBarStyles],
    },
  ],
  [
    MenuBarItemStyles,
    {
      mode: 'append',
      styles: [TopMenuBarItemStyles],
    },
  ],
  [
    MenuStyles,
    {
      mode: 'append',
      styles: [TopMenuStyles],
    },
  ],
  [
    CheckboxMarkupStyles,
    {
      mode: 'append',
      styles: [TopMenuCheckboxStyles],
    },
  ],
];

export const TopNavBar: React.FC<Props> = function TopNavBar({ container, className }) {
  return (
    <TopAppBar className={className}>
      <SContext registry={registry}>
        <Placeholder container={container} />
      </SContext>
    </TopAppBar>
  );
};
