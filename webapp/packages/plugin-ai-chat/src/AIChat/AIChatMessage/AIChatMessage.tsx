/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { clsx } from '@dbeaver/ui-kit';
import { isSameDay } from '@cloudbeaver/core-utils';

import { AIChatMessageFormatter } from './AIChatMessageFormatter/AIChatMessageFormatter.js';
import type { AiMessage } from '@cloudbeaver/core-sdk';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  message: AiMessage;
}

export const AIChatMessage = observer<Props>(function AIChatMessage({ message, className, ...rest }) {
  const date = new Date(message.time);
  const fullTime = date.toLocaleString();
  const displayTime = isSameDay(date, new Date()) ? date.toLocaleTimeString() : fullTime;

  return (
    <div data-id={message.id} className={clsx('tw:whitespace-pre-wrap', className)} title={displayTime} {...rest}>
      <AIChatMessageFormatter message={message} />
    </div>
  );
});
