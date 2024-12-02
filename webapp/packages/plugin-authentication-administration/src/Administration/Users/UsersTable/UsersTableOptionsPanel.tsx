/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { UserEdit } from './UserEdit.js';
import { UsersTableOptionsPanelService } from './UsersTableOptionsPanelService.js';

export const UsersTableOptionsPanel = observer(function UsersTableOptionsPanel() {
  const translate = useTranslate();
  const usersTableOptionsPanelService = useService(UsersTableOptionsPanelService);

  if (!usersTableOptionsPanelService.itemId) {
    return <TextPlaceholder>{translate('ui_not_found')}</TextPlaceholder>;
  }

  return <UserEdit item={usersTableOptionsPanelService.itemId} onClose={usersTableOptionsPanelService.close} />;
});
