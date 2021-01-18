/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled from 'reshadow';
import { css } from 'reshadow';

import type { AdminUser } from '@cloudbeaver/core-authentication';
import { StaticImage } from '@cloudbeaver/core-blocks';

interface Props {
  context: AdminUser;
}

const USER_DETAILS_STYLES = css`
  StaticImage {
    width: 24px;
    height: 24px;
  }
`;

export const Origin: React.FC<Props> = observer(function Origin({ context }) {
  const isLocal = context.origin.type === 'local';
  const icon = isLocal ? '/icons/local_connection.svg' : context.origin.icon;
  const title = isLocal ? 'Local user' : context.origin.displayName;

  return styled(USER_DETAILS_STYLES)(
    <StaticImage icon={icon} title={title} />
  );
});
