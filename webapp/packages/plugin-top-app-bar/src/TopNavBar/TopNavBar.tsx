/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Placeholder, PlaceholderContainer, s, SContext, type StyleRegistry, TopAppBar, useS } from '@cloudbeaver/core-blocks';
import { MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';

import TopMenuBarStyles from './shared/TopMenuBar.module.css';
import TopMenuBarItemStyles from './shared/TopMenuBarItem.module.css';

interface Props {
  container: PlaceholderContainer<Record<string, any>>;
  className?: string;
}

const registry: StyleRegistry = [
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
];

export const TopNavBar: React.FC<Props> = observer(function TopNavBar({ container, className }) {
  const styles = useS(TopMenuBarStyles, TopMenuBarItemStyles);
  return (
    <TopAppBar className={s(styles, { topMenuBar: true }, className)}>
      <SContext registry={registry}>
        <Placeholder container={container} />
      </SContext>
    </TopAppBar>
  );
});
