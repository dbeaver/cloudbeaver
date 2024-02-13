/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  s,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { ServerNodeChangedDialogStyles } from '@cloudbeaver/plugin-root';

interface Payload {
  updateActivity: VoidFunction;
}

export const SessionExpireWarningDialog: DialogComponent<Payload, null> = observer(function SessionExpireWarningDialog({ rejectDialog, payload }) {
  const translate = useTranslate();
  const styles = useS(ServerNodeChangedDialogStyles);

  function onContinueClick() {
    payload.updateActivity();
    rejectDialog();
  }

  return (
    <CommonDialogWrapper size="small" fixedSize>
      <CommonDialogHeader title="app_root_session_expire_warning_title" onReject={rejectDialog} />
      <CommonDialogBody noOverflow>
        <p className={s(styles, { text: true })}>{translate('app_root_session_expire_warning_message')}</p>
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { footer: true })}>
        <Button type="button" mod={['unelevated']} onClick={onContinueClick}>
          {translate('app_root_session_expire_warning_button')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
