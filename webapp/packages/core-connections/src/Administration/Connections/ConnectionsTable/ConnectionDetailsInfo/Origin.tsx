/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { StaticImage } from '@cloudbeaver/core-blocks';

import type { AdminConnection } from '../../../ConnectionsResource';
import { CONNECTION_DETAILS_STYLES } from './ConnectionDetailsStyles';

interface Props {
  context: AdminConnection;
}

export const Origin: React.FC<Props> = observer(function Origin({ context }) {
  const isLocal = context.origin.type === 'local';
  const icon = context.origin.icon;
  const title = context.origin.displayName;

  if (isLocal) {
    return null;
  }

  return styled(CONNECTION_DETAILS_STYLES)(
    <StaticImage icon={icon} title={title} />
  );
});
