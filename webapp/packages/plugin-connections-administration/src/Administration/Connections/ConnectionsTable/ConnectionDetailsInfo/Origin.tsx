/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { type PlaceholderComponent, s, StaticImage, useS } from '@cloudbeaver/core-blocks';

import type { IConnectionDetailsPlaceholderProps } from '../../ConnectionsAdministrationService.js';
import ConnectionDetailsStyles from './ConnectionDetailsStyles.module.css';

export const Origin: PlaceholderComponent<IConnectionDetailsPlaceholderProps> = observer(function Origin({ connection }) {
  const isLocal = connection.origin?.type === AUTH_PROVIDER_LOCAL_ID;
  const style = useS(ConnectionDetailsStyles);

  if (!connection.origin || isLocal) {
    return null;
  }

  const icon = connection.origin.icon;
  const title = connection.origin.displayName;

  return <StaticImage className={s(style, { staticImage: true })} icon={icon} title={title} />;
});
