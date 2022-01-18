/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { useController } from '@cloudbeaver/core-di';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';

import { CustomConnectionController } from './CustomConnectionController';
import { DriverSelectorDialog } from './DriverSelectorDialog/DriverSelectorDialog';

export const CustomConnectionDialog: DialogComponent<null, null> = observer(function CustomConnectionDialog({
  rejectDialog,
}) {
  const controller = useController(CustomConnectionController, rejectDialog);
  const translate = useTranslate();

  return (
    <DriverSelectorDialog
      title={translate('basicConnection_connectionDialog_newConnection')}
      drivers={controller.drivers}
      isLoading={controller.isLoading}
      onSelect={controller.onDriverSelect}
      onClose={rejectDialog}
    />
  );
});
