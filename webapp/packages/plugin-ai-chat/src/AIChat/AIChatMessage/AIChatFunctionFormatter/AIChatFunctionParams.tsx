/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { clsx } from '@dbeaver/ui-kit';
import { useTranslate } from '@cloudbeaver/core-blocks';

interface Props {
  args: Array<[string, any]>;
  className?: string;
}

export const AIChatFunctionParams = observer<Props>(function AIChatFunctionParams({ args, className }) {
  const translate = useTranslate();

  return (
    <div className={clsx('tw:flex tw:flex-col tw:gap-1 tw:pt-2 theme-border-color-background tw:border-t', className)}>
      <div className="tw:text-(--theme-text-hint-on-light) tw:uppercase tw:text-xs tw:tracking-wider tw:mb-1">
        {translate('plugin_ai_chat_function_parameters')}
      </div>
      {args.map(([key, value]) => {
        const val = String(value);
        return (
          <div key={key} className="tw:flex tw:gap-2 tw:items-center">
            <div className="tw:text-(--theme-text-hint-on-light) tw:text-xs tw:shrink-0">{key}:</div>
            <code title={val} className="tw:truncate tw:!text-xs tw:font-medium tw:text-right">
              {val}
            </code>
          </div>
        );
      })}
    </div>
  );
});
