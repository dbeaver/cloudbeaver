/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { ComponentProps } from 'react';

import { s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import { TabList, TabStyles, TabTitleStyles } from '@cloudbeaver/core-ui';

import style from './AdministrationTabList.module.css';

export type AdministrationTabListProps = ComponentProps<typeof TabList>;

const registry: StyleRegistry = [
  [TabStyles, { mode: 'append', styles: [style] }],
  [TabTitleStyles, { mode: 'append', styles: [style] }],
];

export const AdministrationTabList = observer<AdministrationTabListProps>(function AdministrationTabList({ className, ...props }) {
  const styles = useS(style);

  return (
    <SContext registry={registry}>
      <TabList {...props} className={s(styles, { tabList: true, administrationTabs: true }, className)} underline />
    </SContext>
  );
});
