/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { ConnectionImageWithMask } from '@cloudbeaver/core-blocks';

interface Props {
  icon: string;
  connected: boolean;
}

export const AIChatContextManagerConnectionIcon = observer<Props>(function AIChatContextManagerConnectionIcon({ icon, connected }) {
  return (
    <div className="tw:relative">
      <ConnectionImageWithMask icon={icon} connected={connected} maskId="ai-chat-context-icon" />
    </div>
  );
});
