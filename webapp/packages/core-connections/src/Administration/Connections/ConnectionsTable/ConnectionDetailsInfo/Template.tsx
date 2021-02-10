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

export const Template: React.FC<Props> = observer(function Template({ context }) {
  if (!context.template) {
    return null;
  }

  return styled(CONNECTION_DETAILS_STYLES)(
    <StaticImage icon='/icons/template_connection.svg' title='Template connection' />
  );
});
