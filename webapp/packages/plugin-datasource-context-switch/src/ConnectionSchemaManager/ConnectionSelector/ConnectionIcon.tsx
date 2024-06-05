/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ConnectionImageWithMask, ConnectionImageWithMaskSvgStyles, s, SContext, StyleRegistry, useResource, useS } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';

import styles from './ConnectionIcon.module.css';
import ConnectionImageWithMaskSvgBackgroundStyles from './ConnectionImageWithMask.module.css';
import type { IConnectionSelectorExtraProps } from './IConnectionSelectorExtraProps';

export interface ConnectionIconProps extends IConnectionSelectorExtraProps {
  size?: number;
  className?: string;
}

const registry: StyleRegistry = [
  [
    ConnectionImageWithMaskSvgStyles,
    {
      mode: 'append',
      styles: [ConnectionImageWithMaskSvgBackgroundStyles],
    },
  ],
];

export const ConnectionIcon = observer<ConnectionIconProps>(function ConnectionIcon({ connectionKey, size = 24, small = true, className }) {
  const connection = useResource(ConnectionIcon, ConnectionInfoResource, connectionKey ?? null);
  const drivers = useResource(ConnectionIcon, DBDriverResource, CachedMapAllKey);
  const style = useS(styles, ConnectionImageWithMaskSvgBackgroundStyles);

  if (!connection.data?.driverId) {
    return null;
  }

  const driver = drivers.resource.get(connection.data.driverId);

  if (!driver?.icon) {
    return null;
  }

  return (
    <div className={s(style, { connectionIcon: true }, className)}>
      <SContext registry={registry}>
        <ConnectionImageWithMask
          className={s(style, { connectionImageWithMask: true, small })}
          icon={driver.icon}
          connected={connection.data.connected}
          maskId="connection-icon"
          size={size}
          paddingSize={0}
        />
      </SContext>
    </div>
  );
});
