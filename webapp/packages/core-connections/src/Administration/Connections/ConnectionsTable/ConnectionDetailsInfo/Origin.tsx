/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { StaticImage } from '@cloudbeaver/core-blocks';

import { AdminConnection } from '../../../ConnectionsResource';
import { CONNECTION_DETAILS_STYLES } from './ConnectionDetailsStyles';

interface Props {
  context: AdminConnection;
}

export const Origin: React.FC<Props> = function Origin({ context }) {
  const isLocal = context.origin.type === 'local';
  const icon = isLocal ? '/icons/local_connection.svg' : context.origin.icon;
  const title = isLocal ? 'Local connection' : context.origin.displayName;

  return styled(CONNECTION_DETAILS_STYLES)(
    <StaticImage icon={icon} title={title} />
  );
};
