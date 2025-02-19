/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { IconOrImage, ListItem, ListItemDescription, ListItemIcon, ListItemName, s, StaticImage, useS, useTranslate } from '@cloudbeaver/core-blocks';

import style from './Driver.module.css';

export interface IDriver {
  id: string;
  icon?: string;
  name?: string;
  description?: string;
  driverInstalled?: boolean;
}

interface Props {
  driver: IDriver;
  onSelect: (driverId: string) => void;
}

export const Driver = observer<Props>(function Driver({ driver, onSelect }) {
  const translate = useTranslate();
  const select = useCallback(() => onSelect(driver.id), [driver.id, onSelect]);
  const styles = useS(style);

  return (
    <ListItem onClick={select}>
      <ListItemIcon className={s(styles, { icon: true })}>
        <StaticImage icon={driver.icon} className={s(styles, { staticImage: true })} />
        {!driver.driverInstalled && (
          <div className={s(styles, { indicator: true })} title={translate('core_connections_connection_driver_not_installed')}>
            <IconOrImage icon="/icons/info_icon_sm.svg" />
          </div>
        )}
      </ListItemIcon>
      <ListItemName>{driver.name}</ListItemName>
      <ListItemDescription title={driver.description}>{driver.description}</ListItemDescription>
    </ListItem>
  );
});
