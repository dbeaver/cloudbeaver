/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PropsWithChildren } from 'react';
import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';
import { Expandable } from '@cloudbeaver/core-blocks';
import type { AiFunctionCall } from '@cloudbeaver/core-sdk';

import { AIChatFunctionsService } from '../../../AIChatFunctionsService.js';
import { AIChatFunctionParams } from './AIChatFunctionParams.js';

interface Props {
  calls: AiFunctionCall[];
}

export const AIChatFunctionCalls = observer<PropsWithChildren<Props>>(function AIChatFunctionCalls({ calls, children }) {
  const aiChatFunctionsService = useService(AIChatFunctionsService);

  if (calls.length === 1) {
    const call = calls[0]!;
    const func = aiChatFunctionsService.getFunction(call.functionName);
    const args: Array<[string, any]> = Object.entries(call.arguments || {});

    return (
      <div className="tw:flex tw:flex-col tw:gap-3 tw:rounded-(--theme-group-element-radius) tw:bg-(--theme-background)/10 theme-border-color-background tw:border tw:p-2 tw:my-2">
        {func?.description && (
          <div title={func.description} className="tw:text-(--theme-text-hint-on-light) tw:text-sm tw:line-clamp-2">
            {func.description}
          </div>
        )}
        {args.length > 0 && <AIChatFunctionParams args={args} />}
        {children}
      </div>
    );
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      {calls.map((call, index) => {
        const func = aiChatFunctionsService.getFunction(call.functionName);
        const name = func?.name || call.functionName;
        const args: Array<[string, any]> = Object.entries(call.arguments || {});
        const firstArg = args[0]?.[1];

        return (
          <div
            // eslint-disable-next-line react/no-array-index-key -- the order is not going to change
            key={index}
            className="tw:rounded-(--theme-group-element-radius) theme-border-color-background tw:border tw:bg-(--theme-surface) tw:overflow-hidden tw:p-2"
          >
            <Expandable
              className="tw:!p-0"
              label={
                <div className="tw:flex tw:items-center tw:gap-2 tw:w-full tw:justify-between tw:overflow-hidden">
                  <span title={func?.description ? `${name}\n${func.description}` : name} className="tw:font-medium tw:text-sm tw:truncate">
                    {name}
                  </span>
                  {firstArg && (
                    <code
                      title={String(firstArg)}
                      className="tw:!text-xs tw:bg-(--theme-background)/60 tw:px-2 tw:py-0.5 tw:rounded-(--theme-group-element-radius) tw:truncate tw:max-w-40"
                    >
                      {String(firstArg)}
                    </code>
                  )}
                </div>
              }
            >
              <div className="tw:flex tw:flex-col tw:gap-3 tw:pt-2">
                {func?.description && (
                  <div title={func.description} className="tw:text-(--theme-text-hint-on-light) tw:text-sm tw:line-clamp-2">
                    {func.description}
                  </div>
                )}
                {args.length > 0 && <AIChatFunctionParams args={args} />}
              </div>
            </Expandable>
          </div>
        );
      })}
    </div>
  );
});
