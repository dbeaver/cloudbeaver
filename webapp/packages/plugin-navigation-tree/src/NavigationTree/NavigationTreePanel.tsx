/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useS } from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import { NavigationTreeLoader } from './NavigationTreeLoader.js';
import style from './NavigationTreePanel.module.css';

export const NavigationTreePanel: TabContainerPanelComponent = observer(function NavigationTreePanel() {
  const styles = useS(style);

  return (
    <div className={s(styles, { container: true })}>
      <NavigationTreeLoader />
    </div>
  );
});
