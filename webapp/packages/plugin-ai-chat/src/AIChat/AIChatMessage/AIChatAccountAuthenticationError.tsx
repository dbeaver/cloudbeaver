/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Alert, Button, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { AIProfileCredentialsService } from '@cloudbeaver/plugin-ai-profiles';

import { AIChatConversationsResource } from '../AIChatConversation/AIChatConversationsResource.js';

export const AIChatAccountAuthenticationError = observer<{ conversationId: string }>(function AIChatAccountAuthenticationError({ conversationId }) {
  const translate = useTranslate();
  const credentials = useService(AIProfileCredentialsService);
  const notifications = useService(NotificationService);
  const conversations = useService(AIChatConversationsResource);
  const profileId = conversations.get(conversationId)?.profile;

  async function openCredentials(): Promise<void> {
    if (!profileId) {
      return;
    }
    try {
      await credentials.open(profileId);
    } catch (exception: any) {
      notifications.logException(exception, 'plugin_ai_credentials_save_failed');
    }
  }

  return (
    <Alert variant="error">
      <p>{translate('plugin_ai_account_authentication_required')}</p>
      {profileId && (
        <Button type="button" variant="secondary" onClick={openCredentials}>
          {translate('plugin_ai_account_manage')}
        </Button>
      )}
    </Alert>
  );
});
