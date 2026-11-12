/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s, Translate, useS } from '@cloudbeaver/core-blocks';

import type { NavigationNodeRendererComponent } from '../ElementsTree/NavigationNodeComponent.js';
import style from './NavigationTreeConnectionGroupRenderer.module.css';

export const ManageableGroup: NavigationNodeRendererComponent = function ManageableGroup() {
  const styles = useS(style);
  return (
    <div className={s(styles, { connectionGroup: true })}>
      <Translate token="app_navigationTree_connection_group_user" />
    </div>
  );
};
