/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { PlaceholderComponent, StaticImage } from '@cloudbeaver/core-blocks';

import type { IConnectionDetailsPlaceholderProps } from '../../ConnectionsAdministrationService';
import { CONNECTION_DETAILS_STYLES } from './ConnectionDetailsStyles';

export const Origin: PlaceholderComponent<IConnectionDetailsPlaceholderProps> = observer(function Origin({
  connection,
}) {
  const isLocal = connection.origin?.type === AUTH_PROVIDER_LOCAL_ID;

  if (!connection.origin || isLocal) {
    return null;
  }

  const icon = connection.origin.icon;
  const title = connection.origin.displayName;

  return styled(CONNECTION_DETAILS_STYLES)(
    <StaticImage icon={icon} title={title} />
  );
});
