/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  ConnectionImageWithMask,
  ConnectionImageWithMaskSvgStyles,
  getComputed,
  s,
  SContext,
  type StyleRegistry,
  useResource,
  useS,
} from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';

import styles from './ConnectionIcon.module.css';
import ConnectionImageWithMaskSvgBackgroundStyles from './ConnectionImageWithMask.module.css';
import type { IConnectionSelectorExtraProps } from './IConnectionSelectorExtraProps.js';

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

export const ConnectionIconLazyPart = observer<ConnectionIconProps>(function ConnectionIconLazyPart({
  connectionKey,
  size = 24,
  small = true,
  className,
}) {
  const connection = useResource(ConnectionIconLazyPart, ConnectionInfoResource, connectionKey ?? null);
  const drivers = useResource(ConnectionIconLazyPart, DBDriverResource, CachedMapAllKey);
  const style = useS(styles, ConnectionImageWithMaskSvgBackgroundStyles);

  if (!connection.data?.driverId) {
    return null;
  }

  const connected = getComputed(() => connection.data?.connected ?? false);
  const driverIcon = getComputed(() => {
    if (!connection.data?.driverId) {
      return null;
    }

    return drivers.resource.get(connection.data.driverId)?.icon;
  });

  if (!driverIcon) {
    return null;
  }

  return (
    <SContext registry={registry}>
      <ConnectionImageWithMask
        className={s(style, { connectionImageWithMask: true, small }, className)}
        icon={driverIcon}
        connected={connected}
        maskId="connection-icon"
        size={size}
        paddingSize={0}
      />
    </SContext>
  );
});
