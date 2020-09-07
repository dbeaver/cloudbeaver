/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback, useMemo } from 'react';
import styled, { css } from 'reshadow';

import {
  ListItem, ListItemIcon, StaticImage, ListItemName
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { AdminConnectionSearchInfo } from '@cloudbeaver/core-sdk';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { DBDriverResource } from '../../../DBDriverResource';

const styles = composes(
  css`
    StaticImage {
      composes: theme-background-surface theme-border-color-surface from global;
    }
  `,
  css`
    ListItemIcon {
      position: relative;
      min-width: 80px;
      justify-content: flex-end;
    }

    StaticImage {
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
  `
);
type Props = {
  database: AdminConnectionSearchInfo;
  onSelect(database: AdminConnectionSearchInfo): void;
}

export const Database = observer(function Database({ database, onSelect }: Props) {
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

  return styled(useStyles(styles))(
    <ListItem onClick={select}>
      <ListItemIcon>
        {orderedDrivers.map(driverId => <StaticImage key={driverId} icon={drivers.get(driverId)?.icon}/>)}
      </ListItemIcon>
      <ListItemName>{database.host}:{database.port}</ListItemName>
    </ListItem>
  );
});
