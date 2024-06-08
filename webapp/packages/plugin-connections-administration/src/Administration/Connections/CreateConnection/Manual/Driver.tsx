/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { ListItem, ListItemDescription, ListItemIcon, ListItemName, s, StaticImage, useS } from '@cloudbeaver/core-blocks';
import type { DBDriver } from '@cloudbeaver/core-connections';

import style from './Driver.module.css';

interface Props {
  driver: DBDriver;
  onSelect: (driverId: string) => void;
}

export const Driver = observer<Props>(function Driver({ driver, onSelect }) {
  const select = useCallback(() => onSelect(driver.id), [driver]);
  const styles = useS(style);

  return (
    <ListItem onClick={select}>
      <ListItemIcon>
        <StaticImage icon={driver.icon} className={s(styles, { staticImage: true })} />
      </ListItemIcon>
      <ListItemName>{driver.name}</ListItemName>
      <ListItemDescription title={driver.description}>{driver.description}</ListItemDescription>
    </ListItem>
  );
});
