/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { IFormProps } from '@cloudbeaver/core-ui';

import type { AIProfile } from '../AIProfilesResource.js';
import { ConnectedSubscription } from './ConnectedSubscription.js';
import { ConnectSubscription } from './ConnectSubscription.js';
import { getAIProfileAuthorizationController } from './getAIProfileAuthorizationController.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';
import { PendingSubscription } from './PendingSubscription.js';

interface Props extends IFormProps<IAIProfileCredentialsFormState> {
  profile: AIProfile;
}

export const AIProfileSubscriptionFields = observer<Props>(function AIProfileSubscriptionFields({ formState, profile }) {
  const controller = getAIProfileAuthorizationController(formState);

  if (controller.processing) {
    return <PendingSubscription profile={profile} controller={controller} />;
  }

  if (profile.account) {
    return <ConnectedSubscription profile={profile} disabled={formState.isDisabled} />;
  }

  return <ConnectSubscription disabled={formState.isDisabled || !profile.deviceAuthorizationAvailable} controller={controller} />;
});
