/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { Form, InputField, Translate, useFocus, useObservableRef } from '@cloudbeaver/core-blocks';
import { useScriptExportDialog, type IScriptExportTabProps } from '@cloudbeaver/plugin-script-export';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { downloadSql } from '../downloadSql.js';
import { NotificationService } from '@cloudbeaver/core-events';
import { useService } from '@cloudbeaver/core-di';
import { observable } from 'mobx';
import { withTimestamp } from '@cloudbeaver/core-utils';

export const LocalExportTab: TabContainerPanelComponent<IScriptExportTabProps> = observer(function LocalExportTab({
  script,
  fileName: initialFileName,
}) {
  const { dialogState } = useScriptExportDialog();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const notificationService = useService(NotificationService);
  const state = useObservableRef(
    () => ({
      fileName: initialFileName,
    }),
    {
      fileName: observable.ref,
    },
    false,
  );

  useEffect(() => {
    dialogState.canSubmit = state.fileName.trim().length > 0;
    dialogState.onSubmit = () => {
      const fileNameWithTimestamp = withTimestamp(state.fileName);
      downloadSql(fileNameWithTimestamp, script);
      notificationService.logSuccess({
        title: 'plugin_sql_editor_script_exported',
        message: fileNameWithTimestamp,
      });
    };
  });

  return (
    <Form ref={focusedRef} className="tw:p-6 tw:w-full">
      <InputField name="fileName" value={state.fileName} onChange={value => (state.fileName = value)} required small>
        <Translate token="ui_file_name" />
      </InputField>
    </Form>
  );
});
