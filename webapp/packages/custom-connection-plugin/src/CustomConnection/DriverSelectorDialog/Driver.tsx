/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { StaticImage } from '@dbeaver/core/blocks';
import { useStyles, composes } from '@dbeaver/core/theming';

const styles = composes(
  css`
    db-driver-name {
      composes: theme-border-color-secondary from global;
    }
  `,
  css`
    StaticImage {
      box-sizing: border-box;
      width: 24px;
    }
    db-driver {
      position: relative;
      cursor: pointer;
      display: flex;
      box-sizing: border-box;
      align-items: center;
      padding: 8px 12px;
    }
    db-driver-icon {
      display: flex;
      align-items: center;
      box-sizing: border-box;
      padding: 0 12px;
    }
    db-driver-name {
      composes: theme-typography--body1 from global;
      box-sizing: border-box;
      font-weight: 500;
      min-width: 250px;
      padding: 0 24px 0 12px;
      border-right: 1px solid;
    
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    db-driver-description {
      composes: theme-typography--body2 from global;
      box-sizing: border-box;
      max-width: 460px;
      padding: 0 12px 0 24px;
    
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `
);

export interface IDriver {
  id: string;
  icon?: string;
  name?: string;
  description?: string;
}

type DriverProps = {
  driver: IDriver;
  onSelect(driverId: string): void;
}

export const Driver = observer(function Driver({ driver, onSelect }: DriverProps) {

  return styled(useStyles(styles))(
    <db-driver as="div" onClick={() => onSelect(driver.id)}>
      <db-driver-icon as="div"><StaticImage icon={driver.icon}/></db-driver-icon>
      <db-driver-name as="div">{driver.name}</db-driver-name>
      <db-driver-description as="div" title={driver.description}>{driver.description}</db-driver-description>
    </db-driver>
  );
});
