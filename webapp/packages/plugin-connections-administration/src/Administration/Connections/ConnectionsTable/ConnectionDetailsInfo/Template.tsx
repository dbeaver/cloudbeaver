/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { PlaceholderComponent, StaticImage } from '@cloudbeaver/core-blocks';

import type { IConnectionDetailsPlaceholderProps } from '../../ConnectionsAdministrationService';
import { CONNECTION_DETAILS_STYLES } from './ConnectionDetailsStyles';

export const Template: PlaceholderComponent<IConnectionDetailsPlaceholderProps> = observer(function Template({ connection }) {
  if (!connection.template) {
    return null;
  }

  return styled(CONNECTION_DETAILS_STYLES)(
    <StaticImage icon='/icons/template_connection.svg' title='Template connection' />
  );
});
