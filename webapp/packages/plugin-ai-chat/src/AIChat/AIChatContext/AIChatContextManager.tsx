/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ReactElement } from 'react';
import { observer } from 'mobx-react-lite';

import { isNotNullDefined } from '@dbeaver/js-helpers';
import { Combobox, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import {
  compareConnectionsInfo,
  ConnectionInfoActiveProjectKey,
  ConnectionInfoResource,
  createConnectionParam,
  DBDriverResource,
} from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';

import { AIChatContextService } from './AIChatContextService.js';
import { AIChatContextManagerConnectionIcon } from './AIChatContextManagerConnectionIcon.js';

interface IItem {
  id: string;
  label: string;
  icon?: ReactElement | string;
}

const NO_CONTEXT_ID = 'no-context';

interface Props {
  disabled?: boolean;
}

export const AIChatContextManager = observer<Props>(function AIChatContextManager({ disabled }) {
  const translate = useTranslate();
  const aiChatContextService = useService(AIChatContextService);
  const dbDriverResource = useResource(AIChatContextManager, DBDriverResource, CachedMapAllKey);
  const connectionInfoResource = useResource(AIChatContextManager, ConnectionInfoResource, ConnectionInfoActiveProjectKey);

  const items: IItem[] = [{ id: NO_CONTEXT_ID, label: translate('plugin_ai_chat_no_context'), icon: '/icons/database_sm.svg' }];
  const connections = connectionInfoResource.data.filter(isNotNullDefined).sort((a, b) => {
    if (a.connected === b.connected) {
      return compareConnectionsInfo(a, b);
    }

    return Number(b.connected) - Number(a.connected);
  });

  for (const connection of connections) {
    const driver = dbDriverResource.data.find(d => d?.id === connection.driverId);

    items.push({
      id: connection.id,
      label: connection.name,
      icon: driver?.icon ? <AIChatContextManagerConnectionIcon icon={driver.icon} connected={connection.connected} /> : undefined,
    });
  }

  const value = aiChatContextService.currentContext?.connectionKey.connectionId ?? NO_CONTEXT_ID;

  function changeContext(contextId: string): void {
    if (contextId === NO_CONTEXT_ID) {
      aiChatContextService.setContext(null);
    } else {
      const connection = connectionInfoResource.data.find(c => c?.id === contextId);

      if (connection) {
        aiChatContextService.setContext({ connectionKey: createConnectionParam(connection) });
      }
    }
  }

  return (
    <div className="tw:w-full">
      <Combobox
        value={value}
        items={items}
        disabled={disabled}
        keySelector={v => v.id}
        valueSelector={v => v.label}
        titleSelector={v => v.label}
        iconSelector={v => v.icon}
        onSelect={changeContext}
      />
    </div>
  );
});
