/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';
import { css } from 'reshadow';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { PlaceholderComponent, StaticImage } from '@cloudbeaver/core-blocks';
import type { ObjectOrigin } from '@cloudbeaver/core-sdk';

import type { IUserDetailsInfoProps } from '../../UsersAdministrationService';

const USER_DETAILS_STYLES = css`
  StaticImage {
    width: 24px;
    height: 24px;
  }
`;

interface IOriginIconProps {
  origin: ObjectOrigin;
}

export const OriginIcon = observer<IOriginIconProps>(function Origin({ origin }) {
  const isLocal = origin.type === AUTH_PROVIDER_LOCAL_ID;
  const icon = isLocal ? '/icons/local_connection.svg' : origin.icon;
  const title = isLocal ? 'Local user' : origin.displayName;

  return styled(USER_DETAILS_STYLES)(
    <StaticImage key={origin.type + origin.subType} icon={icon} title={title} />
  );
});

export const Origin: PlaceholderComponent<IUserDetailsInfoProps> = observer(function Origin({ user }) {
  return (
    <>
      {user.origins.map(origin => (
        <OriginIcon key={origin.type + origin.subType} origin={origin} />
      ))}
    </>
  );
});
