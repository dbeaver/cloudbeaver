/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { Fragment } from 'react';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { PlaceholderComponent, s, StaticImage, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { ObjectOrigin } from '@cloudbeaver/core-sdk';

import type { IUserDetailsInfoProps } from '../UsersAdministrationService';
import style from './UserCredentialsList.m.css';

interface IUserCredentialsProps {
  origin: ObjectOrigin;
  className?: string;
}

export const UserCredentials = observer<IUserCredentialsProps>(function UserCredentials({ origin, className }) {
  const translate = useTranslate();
  const styles = useS(style);

  const isLocal = origin.type === AUTH_PROVIDER_LOCAL_ID;
  const icon = isLocal ? '/icons/local_connection.svg' : origin.icon;
  const title = isLocal ? translate('authentication_administration_user_local') : origin.displayName;

  return <StaticImage icon={icon} title={title} className={s(styles, { staticImage: true }, className)} />;
});

export const UserCredentialsList: PlaceholderComponent<IUserDetailsInfoProps> = observer(function UserCredentialsList({ user }) {
  return (
    <Fragment key="user-credentials-list">
      {user.origins.map(origin => (
        <UserCredentials key={origin.type + origin.subType} origin={origin} />
      ))}
    </Fragment>
  );
});
