/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { PropsWithChildren } from 'react';

export const AIChatMessageActions = observer(function AIChatMessageActions(props: PropsWithChildren) {
  return (
    <div className="tw:group-focus-within:opacity-100 tw:group-hover:opacity-100 tw:group-focus:opacity-100 tw:group-data-[pin-actions=true]/message:opacity-100 tw:group-data-[hide-actions=true]/message:invisible tw:opacity-0 tw:transition-opacity">
      {props.children}
    </div>
  );
});
