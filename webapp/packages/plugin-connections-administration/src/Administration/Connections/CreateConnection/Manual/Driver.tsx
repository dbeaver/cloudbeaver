/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import {
  ListItem, ListItemIcon, StaticImage, ListItemName, ListItemDescription
} from '@cloudbeaver/core-blocks';
import type { DBDriver } from '@cloudbeaver/core-connections';

const styles = css`
  StaticImage {
    box-sizing: border-box;
    width: 24px;
    max-height: 24px;
  }
`;

interface Props {
  driver: DBDriver;
  onSelect: (driverId: string) => void;
}

export const Driver = observer<Props>(function Driver({ driver, onSelect }) {
  const select = useCallback(() => onSelect(driver.id), [driver]);

  return styled(styles)(
    <ListItem onClick={select}>
      <ListItemIcon><StaticImage icon={driver.icon} /></ListItemIcon>
      <ListItemName>{driver.name}</ListItemName>
      <ListItemDescription title={driver.description}>{driver.description}</ListItemDescription>
    </ListItem>
  );
});
