/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { ConnectionMark, IconOrImage, useResource, useStyles } from '@cloudbeaver/core-blocks';
import { DBDriverResource, ConnectionInfoResource } from '@cloudbeaver/core-connections';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import type { IConnectionSelectorExtraProps } from './IConnectionSelectorExtraProps';

const connectionIconStyle = css`
  icon {
    position: relative;
    display: flex;

    & IconOrImage {
      background-color: #fff;
      padding: 2px;
      border-radius: var(--theme-form-element-radius);

      &[|small] {
        box-sizing: border-box;
      }
    }
  }
`;

interface Props extends IConnectionSelectorExtraProps {
  style?: ComponentStyle;
  className?: string;
}

export const ConnectionIcon: React.FC<Props> = observer(function ConnectionIcon({
  connectionKey,
  small,
  style,
  className,
}) {
  const styles = useStyles(style, connectionIconStyle);

  const connection = useResource(
    ConnectionIcon,
    ConnectionInfoResource,
    connectionKey ?? null
  );
  const driverId = connection.data?.driverId;

  const driver = useResource(ConnectionIcon, DBDriverResource, driverId!, {
    active: driverId !== undefined,
  });

  if (!driver.data?.icon) {
    return null;
  }

  return styled(styles)(
    <icon className={className}>
      <IconOrImage icon={driver.data.icon} {...use({ small })} />
      <ConnectionMark connected={connection.data?.connected ?? false} />
    </icon>
  );
});