/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { Fragment } from 'react';

import type { PlaceholderComponent } from '@cloudbeaver/core-blocks';
import { Popover } from '@dbeaver/ui-kit';

import type { IUserDetailsInfoProps } from '../UsersAdministrationService.js';
import { OverflowIndicator } from './OverflowIndicator.js';
import { UserCredentials } from './UserCredentials.js';

const MAX_VISIBLE_CREDENTIALS = 3;

export const UserCredentialsList: PlaceholderComponent<IUserDetailsInfoProps> = observer(function UserCredentialsList({ user }) {
  const visibleCredentials = user.origins.slice(0, MAX_VISIBLE_CREDENTIALS);

  return (
    <Fragment key="user-credentials-list">
      {visibleCredentials.map(origin => (
        <UserCredentials key={`${origin.type}${origin.subType ?? ''}`} origin={origin} />
      ))}

      {user.origins.length > MAX_VISIBLE_CREDENTIALS && (
        <Popover placement="top">
          <Popover.PopoverDisclosure>
            <OverflowIndicator count={user.origins.length - MAX_VISIBLE_CREDENTIALS} />
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
