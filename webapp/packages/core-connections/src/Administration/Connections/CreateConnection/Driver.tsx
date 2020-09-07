/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import {
  ListItem, ListItemIcon, StaticImage, ListItemName, ListItemDescription
} from '@cloudbeaver/core-blocks';

import { DBDriver } from '../../../DBDriverResource';

const styles = css`
  StaticImage {
    box-sizing: border-box;
    width: 32px;
    max-height: 32px;
  }
`;

type Props = {
  driver: DBDriver;
  onSelect(driverId: string): void;
}

export const Driver = observer(function Driver({ driver, onSelect }: Props) {
  const select = useCallback(() => onSelect(driver.id), [driver]);

  return styled(styles)(
    <ListItem onClick={select}>
      <ListItemIcon><StaticImage icon={driver.icon}/></ListItemIcon>
      <ListItemName>{driver.name}</ListItemName>
      <ListItemDescription title={driver.description}>{driver.description}</ListItemDescription>
    </ListItem>
  );
});
