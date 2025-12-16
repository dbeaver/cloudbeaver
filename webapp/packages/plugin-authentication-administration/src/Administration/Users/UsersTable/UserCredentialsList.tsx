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
import { BaseDropdownStyles, type PlaceholderComponent, s, StaticImage, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { ObjectOrigin } from '@cloudbeaver/core-sdk';

import type { IUserDetailsInfoProps } from '../UsersAdministrationService.js';
import style from './UserCredentialsList.module.css';
import { Menu, MenuButton, MenuItem, MenuProvider } from '@dbeaver/ui-kit';

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
  const styles = useS(style, BaseDropdownStyles);
  const translate = useTranslate();

  const visibleCredentials = user.origins.slice(0, MAX_VISIBLE_CREDENTIALS);

  // TODO: probably better to replace with popover
  return (
    <Fragment key="user-credentials-list">
      {visibleCredentials.map(origin => (
        <UserCredentials key={`${origin.type}${origin.subType ?? ''}`} origin={origin} />
      ))}

      {user.origins.length > MAX_VISIBLE_CREDENTIALS && (
        <MenuProvider placement="top">
          <MenuButton className={s(styles, { menuButton: true })}>
            <div className={s(styles, { hasMoreIndicator: true })}>
              <span>+{user.origins.length - MAX_VISIBLE_CREDENTIALS}</span>
            </div>
          </MenuButton>
          <Menu className={s(styles, { menu: true })} gutter={8} modal>
            {user.origins.slice(MAX_VISIBLE_CREDENTIALS).map(origin => {
              const isLocal = origin.type === AUTH_PROVIDER_LOCAL_ID;
              const title = isLocal ? translate('authentication_administration_user_local') : origin.displayName;

              return (
                <MenuItem key={`${origin.type}${origin.subType ?? ''}`} className={s(styles, { menuItem: true })} title={title}>
                  <UserCredentials origin={origin} />
                </MenuItem>
              );
            })}
          </Menu>
        </MenuProvider>
      )}
    </Fragment>
  );
});
