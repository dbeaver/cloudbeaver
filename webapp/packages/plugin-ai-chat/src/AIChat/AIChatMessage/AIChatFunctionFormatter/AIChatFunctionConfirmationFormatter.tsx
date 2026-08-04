/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { clsx } from '@dbeaver/ui-kit';
import { Expandable, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { type IAIFunctionConfirmationMessage } from '../AIChatMessagesResource.js';
import { AIChatMessageService, EAiFunctionStatus } from '../AIChatMessageService.js';
import { AIChatFunctionsService } from '../../../AIChatFunctionsService.js';
import { AIChatFunctionCalls } from './AIChatFunctionCalls.js';
import { AIChatFunctionConfirmationActions } from './AIChatFunctionConfirmationActions.js';

interface Props {
  message: IAIFunctionConfirmationMessage;
}

const CONTAINER_CLASSES =
  'tw:rounded-(--theme-group-element-radius) tw:bg-(--theme-background)/10 theme-border-color-background tw:border tw:p-2 tw:my-2';

export const AIChatFunctionConfirmationFormatter = observer<Props>(function AIChatFunctionConfirmationFormatter({ message }) {
  const translate = useTranslate();
  const aiChatMessageService = useService(AIChatMessageService);
  const aiChatFunctionsService = useService(AIChatFunctionsService);

  const calls = message.functionConfirmation?.functionCalls;
  const status = aiChatMessageService.getFunctionStatus(message);

  if (!calls || calls.length === 0) {
    return null;
  }

  if (status === EAiFunctionStatus.REJECTED) {
    const names = calls.map(call => aiChatFunctionsService.getFunction(call.functionName)?.name || call.functionName).join(', ');

    return (
      <div className="tw:my-2">
        <Expandable
          className="tw:!p-0"
          label={
            <div className="tw:text-sm tw:flex tw:items-center tw:gap-2 tw:text-(--theme-text-hint-on-light) tw:truncate">
              <span className="tw:text-xs">✕</span>
              <span className="tw:truncate" title={names}>
                {names}
              </span>
            </div>
          }
        >
          <div className={clsx(calls.length > 1 && CONTAINER_CLASSES)}>
            <AIChatFunctionCalls calls={calls} />
          </div>
        </Expandable>
      </div>
    );
  }

  const shouldConfirm = aiChatMessageService.isFunctionConfirmationRequired(message);

  if (!shouldConfirm) {
    return null;
  }

  if (calls.length === 1) {
    const call = calls[0]!;
    const func = aiChatFunctionsService.getFunction(call.functionName);
    const name = func?.name || call.functionName;

    return (
      <div className={CONTAINER_CLASSES}>
        <Expandable
          className="tw:!p-0"
          label={
            <div className="tw:flex tw:items-center tw:gap-2 tw:truncate">
              <div className="tw:text-sm tw:flex-1 tw:min-w-0 tw:truncate">
                <span className="tw:text-(--theme-text-hint-on-light)">{translate('ui_allow')}</span>
                {/* @TODO change to the mcp provider name here and below once implemented */}
                <span className="tw:font-medium"> CloudBeaver </span>
                <span className="tw:text-(--theme-text-hint-on-light)">{translate('plugin_ai_chat_mcp_single_function_request')} </span>
                <strong>{name}</strong>
              </div>
            </div>
          }
        >
          <AIChatFunctionCalls calls={[call]} />
        </Expandable>

        <AIChatFunctionConfirmationActions message={message} />
      </div>
    );
  }

  return (
    <div className={CONTAINER_CLASSES}>
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3 tw:truncate">
        <div className="tw:text-sm tw:flex-1 tw:min-w-0 tw:truncate">
          <span className="tw:font-medium">CloudBeaver </span>
          <span className="tw:text-(--theme-text-hint-on-light)">{translate('plugin_ai_chat_mcp_function_request')}</span>
        </div>
      </div>

      <AIChatFunctionCalls calls={calls} />
      <AIChatFunctionConfirmationActions message={message} />
    </div>
  );
});
