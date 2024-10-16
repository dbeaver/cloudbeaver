/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { CommonDialogBody, CommonDialogHeader, CommonDialogWrapper, s, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';

import { DriverSelector } from './DriverSelector.js';
import styles from './DriverSelectorDialog.module.css';
import { useDriverSelectorDialog } from './useDriverSelectorDialog.js';

export const DriverSelectorDialog: DialogComponent<null> = observer(function DriverSelectorDialog({ rejectDialog }) {
  const translate = useTranslate();
  const style = useS(styles);
  useResource(DriverSelectorDialog, ProjectInfoResource, CachedMapAllKey, { forceSuspense: true });
  const dbDriverResource = useResource(DriverSelectorDialog, DBDriverResource, CachedMapAllKey);

  const enabledDrivers = dbDriverResource.resource.enabledDrivers;
  const dialog = useDriverSelectorDialog(
    enabledDrivers.map(driver => driver.id),
    rejectDialog,
  );

  return (
    <CommonDialogWrapper size="large" autofocus={false} fixedSize>
      <CommonDialogHeader title={translate('plugin_connections_new_connection_dialog_title')} />
      <CommonDialogBody noBodyPadding noOverflow>
        <DriverSelector className={s(style, { driverSelector: true })} drivers={enabledDrivers} onSelect={dialog.select} />
      </CommonDialogBody>
    </CommonDialogWrapper>
  );
});
