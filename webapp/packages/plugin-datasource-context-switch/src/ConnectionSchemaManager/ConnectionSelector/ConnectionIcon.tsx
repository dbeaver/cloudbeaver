/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import {
  ConnectionImageWithMask,
  ConnectionImageWithMaskSvgStyles,
  s,
  SContext,
  StyleRegistry,
  useResource,
  useStyles,
} from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { default as ConnectionImageWithMaskSvgBackgroundStyles } from './ConnectionImageWithMask.m.css';
import type { IConnectionSelectorExtraProps } from './IConnectionSelectorExtraProps';

const connectionIconStyle = css`
  icon {
    position: relative;
    display: flex;

    & ConnectionImageWithMask {
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

const registry: StyleRegistry = [
  [
    ConnectionImageWithMaskSvgStyles,
    {
      mode: 'append',
      styles: [ConnectionImageWithMaskSvgBackgroundStyles],
    },
  ],
];

export const ConnectionIcon: React.FC<Props> = observer(function ConnectionIcon({ connectionKey, small = true, style, className }) {
  const styles = useStyles(style, connectionIconStyle);

  const connection = useResource(ConnectionIcon, ConnectionInfoResource, connectionKey ?? null);

  const drivers = useResource(ConnectionIcon, DBDriverResource, CachedMapAllKey);

  if (!connection.data?.driverId) {
    return null;
  }

  const driver = drivers.resource.get(connection.data.driverId);

  if (!driver?.icon) {
    return null;
  }

  return styled(styles)(
    <icon className={s(ConnectionImageWithMaskSvgBackgroundStyles, { connectionIcon: true }, className)}>
      <SContext registry={registry}>
        <ConnectionImageWithMask
          icon={driver.icon}
          connected={connection.data.connected}
          maskId="connection-icon"
          size={16}
          paddingSize={0}
          {...use({ small })}
        />
      </SContext>
    </icon>,
  );
});
