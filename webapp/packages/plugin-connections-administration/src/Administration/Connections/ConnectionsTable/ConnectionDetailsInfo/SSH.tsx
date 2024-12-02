/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type PlaceholderComponent, s, StaticImage, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { NetworkHandlerResource, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';

import type { IConnectionDetailsPlaceholderProps } from '../../ConnectionsAdministrationService.js';
import ConnectionDetailsStyles from './ConnectionDetailsStyles.module.css';

export const SSH: PlaceholderComponent<IConnectionDetailsPlaceholderProps> = observer(function SSH({ connection }) {
  const translate = useTranslate();
  const style = useS(ConnectionDetailsStyles);
  const sshConfig = connection.networkHandlersConfig?.find(state => state.id === SSH_TUNNEL_ID);
  const applicable = sshConfig?.enabled === true;
  const handler = useResource(SSH, NetworkHandlerResource, SSH_TUNNEL_ID, { active: applicable });

  if (!applicable) {
    return null;
  }

  return (
    <StaticImage
      className={s(style, { staticImage: true })}
      icon="/icons/ssh_tunnel.svg"
      title={translate(handler.data?.label || 'connections_network_handler_ssh_tunnel_title')}
    />
  );
});
