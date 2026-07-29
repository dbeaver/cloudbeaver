/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Expandable, Link, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { TranslateFn } from '@cloudbeaver/core-localization';
import { NotificationService } from '@cloudbeaver/core-events';
import { AiFunctionType } from '@cloudbeaver/core-sdk';

import { UnstyledButton } from '@dbeaver/ui-kit';

import type { IAIFunctionMessage } from '../AIChatMessagesResource.js';
import { AIChatFunctionsService, parseAIFunction, type AIFunctionName, type AIParamsFor } from '../../../AIChatFunctionsService.js';
import { AIChatFunctionCalls } from './AIChatFunctionCalls.js';

interface Props {
  message: IAIFunctionMessage;
}

export const AIChatFunctionFormatter = observer<Props>(function AIChatFunctionFormatter({ message }) {
  const translate = useTranslate();
  const aiChatFunctionsService = useService(AIChatFunctionsService);
  const notificationService = useService(NotificationService);

  if (message.functionResult.type !== AiFunctionType.Action) {
    const func = aiChatFunctionsService.getFunction(message.functionCall.functionName);
    const name = func?.name || message.functionCall.functionName;
    const resultValue =
      typeof message.functionResult.value === 'string' ? message.functionResult.value : JSON.stringify(message.functionResult.value);

    return (
      <div className="tw:my-2">
        <Expandable
          className="tw:!p-0"
          label={
            <div className="tw:text-sm tw:flex tw:items-center tw:gap-2 tw:text-(--theme-text-hint-on-light) tw:truncate">
              <span className="tw:text-xs">✓</span>
              <span className="tw:truncate" title={func?.description}>
                {name}
              </span>
            </div>
          }
        >
          <AIChatFunctionCalls calls={[message.functionCall]}>
            <div className="tw:flex tw:flex-col tw:gap-1 tw:pt-2 tw:text-(--theme-text-hint-on-light)">
              <div className="tw:uppercase tw:text-xs tw:tracking-wider tw:mb-1">{translate('plugin_ai_chat_function_result')}</div>
              <div title={resultValue} className="tw:break-all tw:line-clamp-3 tw:text-xs">
                {resultValue}
              </div>
            </div>
          </AIChatFunctionCalls>
        </Expandable>
      </div>
    );
  }

  function executeFunction(functionName: string, params: unknown) {
    try {
      aiChatFunctionsService.executeFunction(functionName as AIFunctionName, params as AIParamsFor<AIFunctionName>);
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_chat_function_execution_fail');
    }
  }

  return (
    <div className="tw:overflow-x-auto tw:my-2">
      <UnstyledButton
        className="tw:max-w-max"
        render={<Link />}
        onClick={() => executeFunction(message.functionCall.functionName, message.functionResult.value)}
      >
        {getFunctionActionLabel(message.functionCall.functionName, message.functionResult.value, translate)}
      </UnstyledButton>
    </div>
  );
});

function getFunctionActionLabel(fn: string, params: unknown, translate: TranslateFn): string {
  const parsed = parseAIFunction(fn, params);

  if (!parsed) {
    return fn;
  }

  switch (parsed.fn) {
    case 'db_openTableDataEditor':
      return `${translate('ui_open')} "${parsed.params.objectName}"`;
    case 'db_openSQLEditor':
      return `${translate('ui_open')} ${translate('sql_editor_script_editor')}`;
    default:
      return translate('plugin_ai_chat_action_unknown');
  }
}
