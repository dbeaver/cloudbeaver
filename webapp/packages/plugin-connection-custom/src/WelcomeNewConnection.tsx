/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Cell, IconOrImage, useTranslate } from '@cloudbeaver/core-blocks';
import { observer } from 'mobx-react-lite';
import { ACTION_CONNECTION_CUSTOM } from './Actions/ACTION_CONNECTION_CUSTOM.js';
import { useService } from '@cloudbeaver/core-di';
import { CustomConnectionPluginBootstrap } from './CustomConnectionPluginBootstrap.js';

export const WelcomeNewConnection = observer(function WelcomeNewConnection() {
  const customConnectionPluginBootstrap = useService(CustomConnectionPluginBootstrap);
  const translate = useTranslate();
  return (
    <Cell
      before={<IconOrImage icon="/icons/plugin_connection_new.svg" />}
      description={translate(ACTION_CONNECTION_CUSTOM.info.tooltip)}
      className="tw:cursor-pointer tw:rounded-sm tw:overflow-hidden"
      big
      onClick={() => customConnectionPluginBootstrap.openConnectionsDialog()}
    >
      {translate(ACTION_CONNECTION_CUSTOM.info.label)}
    </Cell>
  );
});
