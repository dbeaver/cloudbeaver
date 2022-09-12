/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';
import styled, { css } from 'reshadow';

import {
  ListItem, ListItemIcon, StaticImage, ListItemName
} from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import type { AdminConnectionSearchInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

const styles = css`
    ListItemIcon {
      position: relative;
      min-width: 80px;
      justify-content: flex-end;
    }

    StaticImage {
      composes: theme-background-surface theme-border-color-surface from global;
      box-sizing: border-box;
      width: 32px;
      border-radius: 50%;
      border: solid 2px;

      &:hover {
        z-index: 1;
      }
      &:not(:first-child) {
        margin-left: -20px;
      }
    }
  `;

interface Props {
  database: AdminConnectionSearchInfo;
  onSelect: (database: AdminConnectionSearchInfo) => void;
}

export const Database = observer<Props>(function Database({ database, onSelect }) {
  const drivers = useService(DBDriverResource);
  const select = useCallback(() => onSelect(database), [database]);
  const orderedDrivers = useMemo(() => (
    database.possibleDrivers
      .slice()
      .sort((a, b) => {
        if (a === database.defaultDriver) {
          return 1;
        }
        if (b === database.defaultDriver) {
          return -1;
        }
        return a.localeCompare(b);
      })
  ), [database]);

  const host = database.host + ':' + database.port;
  const name = database.displayName !== database.host ? database.displayName + ' (' + host + ')' : host;

  return styled(useStyles(styles))(
    <ListItem onClick={select}>
      <ListItemIcon>
        {orderedDrivers.map(driverId => <StaticImage key={driverId} icon={drivers.get(driverId)?.icon} />)}
      </ListItemIcon>
      <ListItemName>{name}</ListItemName>
    </ListItem>
  );
});
