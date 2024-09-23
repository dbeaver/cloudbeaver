/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DialogComponent, DialogueStateResult } from '@cloudbeaver/core-dialogs';

import { ConfirmationDialog, type ConfirmationDialogPayload } from '../CommonDialog/ConfirmationDialog.js';

export const ConfirmationDialogDelete: DialogComponent<ConfirmationDialogPayload, DialogueStateResult | string> = function ConfirmationDialogDelete({
  payload,
  ...rest
}) {
  const bigIcon = payload.bigIcon ?? payload.subTitle === undefined ?? true;
  let icon = payload.icon ?? '/icons/error_icon_sm.svg';

  if (bigIcon) {
    icon = '/icons/error_icon.svg';
  }

  return <ConfirmationDialog payload={{ ...payload, icon, bigIcon }} {...rest} />;
};
