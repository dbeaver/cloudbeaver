/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, useTranslate } from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import { SQLCodeEditorLoader, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-new';

interface IPayload {
  text: string;
}

export const QueryDetailsDialog: DialogComponent<IPayload> = observer(function QueryDetailsDialog(props) {
  const translate = useTranslate();
  const sqlDialect = useSqlDialectExtension(undefined);
  const extensions = useCodemirrorExtensions();
  extensions.set(...sqlDialect);

  return (
    <CommonDialogWrapper size="large" fixedWidth>
      <CommonDialogHeader title={translate('plugin_datasource_transaction_manager_logs_table_column_text')} onReject={props.rejectDialog} />
      <CommonDialogBody noBodyPadding noOverflow>
        <SQLCodeEditorLoader value={props.payload.text} extensions={extensions} readonly />
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button mod={['outlined']} onClick={props.rejectDialog}>
          {translate('ui_stepper_back')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
