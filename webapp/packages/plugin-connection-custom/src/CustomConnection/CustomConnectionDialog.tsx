/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { useController } from '@cloudbeaver/core-di';
import { DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';

import { ConnectionFormDialog } from './ConnectionFormDialog/ConnectionFormDialog';
import { CustomConnectionController, ConnectionStep } from './CustomConnectionController';
import { DriverSelectorDialog } from './DriverSelectorDialog/DriverSelectorDialog';

export const CustomConnectionDialog = observer(function CustomConnectionDialog({
  rejectDialog,
}: DialogComponentProps<null, null>) {
  const controller = useController(CustomConnectionController);
  let title = useTranslate('basicConnection_connectionDialog_newConnection');

  if (controller.step === ConnectionStep.Connection && controller.driver?.name) {
    title = controller.driver.name;
  }

  if (controller.step === ConnectionStep.Connection && controller.driver) {
    return (
      <ConnectionFormDialog
        title={title}
        driver={controller.driver}
        onBack={() => controller.onStep(ConnectionStep.Driver)}
        onClose={rejectDialog}
      />
    );
  }

  return (
    <DriverSelectorDialog
      title={title}
      drivers={controller.drivers}
      onSelect={controller.onDriverSelect}
      isLoading={controller.isLoading}
      onClose={rejectDialog}
    />
  );
});
