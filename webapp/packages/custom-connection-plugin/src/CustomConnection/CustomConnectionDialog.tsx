/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { useController } from '@dbeaver/core/di';
import { DialogComponent, DialogComponentProps } from '@dbeaver/core/dialogs';
import { useLocale } from '@dbeaver/core/localization';

import { ConnectionFormDialog } from './ConnectionFormDialog/ConnectionFormDialog';
import { CustomConnectionController, ConnectionStep } from './CustomConnectionController';
import { DriverSelectorDialog } from './DriverSelectorDialog/DriverSelectorDialog';

export const CustomConnectionDialog: DialogComponent<null, null> = observer(
  function CustomConnectionDialog(props: DialogComponentProps<null, null>) {
    const controller = useController(CustomConnectionController);
    let title = useLocale('basicConnection_connectionDialog_newConnection');

    if (controller.step === ConnectionStep.Connection && controller.driver?.name) {
      title = controller.driver.name;
    }

    if (controller.step === ConnectionStep.Connection && controller.driver) {
      return (
        <ConnectionFormDialog
          title={title}
          driver={controller.driver}
          onBack={() => controller.onStep(ConnectionStep.Driver)}
          onClose={props.rejectDialog}
        />
      );
    }

    return (
      <DriverSelectorDialog
        title={title}
        drivers={controller.drivers}
        onSelect={controller.onDriverSelect}
        isLoading={controller.isLoading}
        onClose={props.rejectDialog}
      />
    );
  }
);
