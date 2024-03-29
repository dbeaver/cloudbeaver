/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { BaseForm, IBaseFormSubmitInfo, IFormState } from '@cloudbeaver/core-ui';

import { IUserProfileFormState, UserProfileFormService } from './UserProfileFormService';

interface Props {
  state: IFormState<IUserProfileFormState>;
}

export const UserProfileForm = observer<Props>(function UserProfileForm({ state }) {
  const notificationService = useService(NotificationService);
  const userProfileFormService = useService(UserProfileFormService);

  function onSubmit({ success }: IBaseFormSubmitInfo) {
    if (success) {
      notificationService.logSuccess({ title: 'authentication_administration_user_updated' });
    } else {
      notificationService.logError({ title: 'authentication_administration_user_update_failed' });
    }
  }

  return <BaseForm service={userProfileFormService} state={state} onSubmit={onSubmit} />;
});
