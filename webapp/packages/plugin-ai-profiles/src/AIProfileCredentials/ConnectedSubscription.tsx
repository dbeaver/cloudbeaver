/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Button, ConfirmationDialog, Container, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';

import { AIProfilesResource, type AIProfile } from '../AIProfilesResource.js';

interface Props {
  profile: AIProfile;
  disabled: boolean;
}

export const ConnectedSubscription = observer<Props>(function ConnectedSubscription({ profile, disabled }) {
  const translate = useTranslate();
  const dialogs = useService(CommonDialogService);
  const notifications = useService(NotificationService);
  const profiles = useService(AIProfilesResource);
  const [processing, setProcessing] = useState(false);

  async function disconnect(): Promise<void> {
    const { status } = await dialogs.open(ConfirmationDialog, {
      title: 'plugin_ai_account_disconnect',
      message: 'plugin_ai_account_disconnect_confirmation',
      confirmActionText: 'plugin_ai_account_disconnect',
    });
    if (status !== DialogueStateResult.Resolved) {
      return;
    }
    setProcessing(true);
    try {
      await profiles.disconnectAccount(profile.id);
      notifications.logSuccess({ title: 'plugin_ai_account_disconnected', message: profile.name });
    } catch (exception: any) {
      notifications.logException(exception, 'plugin_ai_account_disconnect_failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <div role="status">
        {translate('plugin_ai_account_connected')}
        {profile.account?.email ? `: ${profile.account.email}` : ''}
      </div>
      <Container className="tw:self-start" keepSize>
        <Button type="button" variant="secondary" disabled={disabled || processing} onClick={disconnect}>
          {translate('plugin_ai_account_disconnect')}
        </Button>
      </Container>
    </>
  );
});
