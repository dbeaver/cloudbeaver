/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { ConnectionMark, IconOrImage, useMapResource } from '@cloudbeaver/core-blocks';
import { DBDriverResource, ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useStyles } from '@cloudbeaver/core-theming';
import type { MenuBaseItemIconComponent } from '@cloudbeaver/core-view';

import { ConnectionSelector } from './ConnectionSelector';
import type { IConnectionSelectorExtraProps } from './IConnectionSelectorExtraProps';

const connectionIconStyle = css`
  icon {
    position: relative;
    display: flex;
  }
`;

export const ConnectionIcon: MenuBaseItemIconComponent<IConnectionSelectorExtraProps> = observer(function ConnectionInfo({
  style,
  connectionKey,
  className,
}) {
  const styles = useStyles(style, connectionIconStyle);

  const connection = useMapResource(
    ConnectionSelector,
    ConnectionInfoResource,
    connectionKey
  );
  const driverId = connection.data?.driverId;

  const driver = useMapResource(ConnectionSelector, DBDriverResource, driverId!, {
    active: driverId !== undefined,
  });

  if (!driver.data?.icon) {
    return null;
  }

  return styled(styles)(
    <icon className={className}>
      <IconOrImage icon={driver.data.icon} />
      <ConnectionMark connected={connection.data?.connected ?? false} />
    </icon>
  );
});