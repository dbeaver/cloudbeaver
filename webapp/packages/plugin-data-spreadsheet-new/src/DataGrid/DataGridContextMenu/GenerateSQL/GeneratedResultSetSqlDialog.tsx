/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
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
  useClipboard,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { type DialogComponentProps } from '@cloudbeaver/core-dialogs';

import style from './GeneratedResultSetSqlDialog.module.css';

interface Payload {
  generatedSql: string;
}

export const GeneratedResultSetSqlDialog = observer<DialogComponentProps<Payload>>(function GeneratedResultSetSqlDialog({ rejectDialog, payload }) {
  const translate = useTranslate();
  const copy = useClipboard();
  const styles = useS(style);

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader title="data_grid_table_generate_sql_dialog_title" icon="sql-script" onReject={rejectDialog} />
      <CommonDialogBody noOverflow noBodyPadding>
        <div className={s(styles, { sqlContainer: true })}>
          <textarea className={s(styles, { sqlTextarea: true })} value={payload.generatedSql} spellCheck={false} readOnly />
        </div>
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button variant="secondary" disabled={!payload.generatedSql} onClick={() => copy(payload.generatedSql, true)}>
          {translate('ui_copy_to_clipboard')}
        </Button>
        <Button onClick={() => rejectDialog()}>{translate('ui_close')}</Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
