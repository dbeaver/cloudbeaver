/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Button } from '@dbeaver/ui-kit';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-blocks';

import { AIChatMessagesResource, type IAIFunctionConfirmationMessage } from '../AIChatMessagesResource.js';

interface Props {
  message: IAIFunctionConfirmationMessage;
}

export const AIChatFunctionConfirmationActions = observer<Props>(function AIChatFunctionConfirmationActions({ message }) {
  const translate = useTranslate();
  const aiChatMessagesResource = useService(AIChatMessagesResource);

  return (
    <div className="tw:flex tw:gap-2 tw:mt-2">
      <Button size="small" onClick={() => aiChatMessagesResource.processFunctionCall(message, true)}>
        {translate('ui_allow')}
      </Button>
      <Button size="small" variant="secondary" onClick={() => aiChatMessagesResource.processFunctionCall(message, false)}>
        {translate('ui_decline')}
      </Button>
    </div>
  );
});
