/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { Loader, useDataResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { UserProfileService } from '../UserProfileService';
import { UserForm } from './UserForm';

const style = css`
  Loader {
    height: 100%;
  }
`;

export const UserProfileForm = observer(function UserProfileForm() {
  const userProfileService = useService(UserProfileService);
  const userInfo = useDataResource(UserProfileForm, UserInfoResource, {
    key: undefined as any,
    includes: ['includeMetaParameters'],
  });
  const close = useCallback(() => userProfileService.close(true), []);

  if (!userProfileService.formState) {
    return null;
  }

  return styled(style)(
    <Loader state={userInfo}>
      {() => userInfo.data && <UserForm user={userInfo.data} state={userProfileService.formState!} onClose={close} />}
    </Loader>
  );
});
