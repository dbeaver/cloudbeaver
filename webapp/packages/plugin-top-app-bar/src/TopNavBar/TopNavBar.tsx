/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  CheckboxMarkupStyles,
  MenuItemElementStyles,
  MenuItemStyles,
  MenuPanelStyles,
  MenuSeparatorStyles,
  MenuStyles,
  Placeholder,
  PlaceholderContainer,
  s,
  SContext,
  type StyleRegistry,
  TopAppBar,
  useS,
} from '@cloudbeaver/core-blocks';
import { MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';

import TopMenuStyles from './shared/TopMenu.module.css';
import TopMenuBarStyles from './shared/TopMenuBar.module.css';
import TopMenuBarItemStyles from './shared/TopMenuBarItem.module.css';
import TopMenuCheckboxStyles from './shared/TopMenuCheckbox.module.css';
import TopMenuItemStyles from './shared/TopMenuItem.module.css';
import TopMenuItemElementStyles from './shared/TopMenuItemElement.module.css';
import TopMenuPanelStyles from './shared/TopMenuPanel.module.css';
import TopMenuSeparatorStyles from './shared/TopMenuSeparator.module.css';

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

export const TopNavBar: React.FC<Props> = observer(function TopNavBar({ container, className }) {
  const styles = useS(TopMenuStyles, TopMenuBarStyles, TopMenuBarItemStyles);
  return (
    <TopAppBar className={s(styles, { topMenuBar: true }, className)}>
      <SContext registry={registry}>
        <Placeholder container={container} />
      </SContext>
    </TopAppBar>
  );
});
