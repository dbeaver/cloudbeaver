/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import { TabList, TabListStyles, TabStyles } from '@cloudbeaver/core-ui';

import style from './SqlExecutionPlanViewBar.module.css';

const registry: StyleRegistry = [
  [TabListStyles, { mode: 'append', styles: [style] }],
  [TabStyles, { mode: 'append', styles: [style] }],
];

export function SqlExecutionPlanViewBar() {
  const styles = useS(style);

  return (
    <div className={s(styles, { tabBar: true })}>
      <SContext registry={registry}>
        <TabList vertical rotated />
      </SContext>
    </div>
  );
}
