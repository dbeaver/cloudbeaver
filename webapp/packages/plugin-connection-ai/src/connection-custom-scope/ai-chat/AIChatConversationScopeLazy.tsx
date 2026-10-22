/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Suspense, type ReactElement } from 'react';
import { Loader } from '@cloudbeaver/core-blocks';
import type { AIChatActionsProps } from '@cloudbeaver/plugin-ai-chat';

import { LazyAIChatConversationScope } from './AIChatConversationScopeLoader.js';

export function AIChatConversationScope(props: AIChatActionsProps): ReactElement {
  return (
    <Suspense fallback={<Loader className="tw:h-7 tw:w-7" small />}>
      <LazyAIChatConversationScope {...props} />
    </Suspense>
  );
}
