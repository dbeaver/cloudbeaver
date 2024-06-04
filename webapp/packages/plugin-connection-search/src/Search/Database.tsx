/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';

import { ListItem, ListItemIcon, ListItemName, s, StaticImage, useS } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import type { AdminConnectionSearchInfo } from '@cloudbeaver/core-sdk';

import style from './Database.module.css';

interface Props {
  database: AdminConnectionSearchInfo;
  onSelect: (database: AdminConnectionSearchInfo) => void;
}

export const Database = observer<Props>(function Database({ database, onSelect }) {
  const styles = useS(style);
  const drivers = useService(DBDriverResource);
  const select = useCallback(() => onSelect(database), [database]);
  const orderedDrivers = useMemo(
    () =>
      database.possibleDrivers.slice().sort((a, b) => {
        if (a === database.defaultDriver) {
          return 1;
        }
        if (b === database.defaultDriver) {
          return -1;
        }
        return a.localeCompare(b);
      }),
    [database],
  );

  const host = database.host + ':' + database.port;
  const name = database.displayName !== database.host ? database.displayName + ' (' + host + ')' : host;

  return (
    <ListItem onClick={select}>
      <ListItemIcon className={s(styles, { listItemIcon: true })}>
        {orderedDrivers.map(driverId => (
          <StaticImage key={driverId} className={s(styles, { staticImage: true })} icon={drivers.get(driverId)?.icon} />
        ))}
      </ListItemIcon>
      <ListItemName>{name}</ListItemName>
    </ListItem>
  );
});
