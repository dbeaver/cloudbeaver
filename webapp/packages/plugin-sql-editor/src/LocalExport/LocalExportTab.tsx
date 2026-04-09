/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Form, InputField, Translate, useFocus, useForm, useObservableRef } from '@cloudbeaver/core-blocks';
import { type IScriptExportTabProps } from '@cloudbeaver/plugin-script-export';
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

  useForm({
    onSubmit(event) {
      const fileNameWithTimestamp = withTimestamp(state.fileName);
      downloadSql(fileNameWithTimestamp, script);
      notificationService.logSuccess({
        title: 'plugin_sql_editor_script_exported',
        message: `${fileNameWithTimestamp}.sql`,
      });
    },
  });

  return (
    <Form ref={focusedRef}>
      <InputField name="fileName" value={state.fileName} required small onChange={value => (state.fileName = value)}>
        <Translate token="ui_file_name" />
      </InputField>
    </Form>
  );
});
