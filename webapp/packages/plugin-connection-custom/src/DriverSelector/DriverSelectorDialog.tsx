/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { CommonDialogBody, CommonDialogHeader, CommonDialogWrapper, s, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';

import { DriverSelector } from './DriverSelector.js';
import styles from './DriverSelectorDialog.module.css';
import { useDriverSelectorDialog } from './useDriverSelectorDialog.js';

type Payload = {
  projectId?: string;
  folderPath?: string;
};

export const DriverSelectorDialog: DialogComponent<Payload> = observer(function DriverSelectorDialog({ rejectDialog, payload }) {
  const translate = useTranslate();
  const style = useS(styles);
  useResource(DriverSelectorDialog, ProjectInfoResource, CachedMapAllKey, { forceSuspense: true });
  const dialog = useDriverSelectorDialog({
    projectId: payload.projectId,
    folderPath: payload.folderPath,
    onSelect: rejectDialog,
  });

  return (
    <CommonDialogWrapper size="large" autofocus={false} fixedSize>
      <CommonDialogHeader title={translate('plugin_connections_new_connection_dialog_title')} />
      <CommonDialogBody noBodyPadding noOverflow>
        <DriverSelector className={s(style, { driverSelector: true })} drivers={dialog.drivers} onSelect={dialog.select} />
      </CommonDialogBody>
    </CommonDialogWrapper>
  );
});
