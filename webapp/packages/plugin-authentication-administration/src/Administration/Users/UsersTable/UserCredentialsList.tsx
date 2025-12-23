/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { Fragment } from 'react';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { type PlaceholderComponent, s, StaticImage, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { ObjectOrigin } from '@cloudbeaver/core-sdk';
import { Popover } from '@dbeaver/ui-kit';

import type { IUserDetailsInfoProps } from '../UsersAdministrationService.js';
import style from './UserCredentialsList.module.css';

const MAX_VISIBLE_CREDENTIALS = 3;

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
  const styles = useS(style);
  const visibleCredentials = user.origins.slice(0, MAX_VISIBLE_CREDENTIALS);

  return (
    <Fragment key="user-credentials-list">
      {visibleCredentials.map(origin => (
        <UserCredentials key={`${origin.type}${origin.subType ?? ''}`} origin={origin} />
      ))}

      {user.origins.length > MAX_VISIBLE_CREDENTIALS && (
        <Popover placement="top">
          <Popover.PopoverDisclosure>
            <div className={s(styles, { hasMoreIndicator: true })}>
              <span>+{user.origins.length - MAX_VISIBLE_CREDENTIALS}</span>
            </div>
          </Popover.PopoverDisclosure>

          <Popover.PopoverContent className="tw:flex tw:gap-2" gutter={4} modal hideOnInteractOutside>
            {user.origins.slice(MAX_VISIBLE_CREDENTIALS).map(origin => (
              <div key={`${origin.type}${origin.subType ?? ''}`} className="tw:p-1">
                <UserCredentials origin={origin} />
              </div>
            ))}
          </Popover.PopoverContent>
        </Popover>
      )}
    </Fragment>
  );
});
