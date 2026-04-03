/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import { Button, Fill, Form, InputField, Translate, useFocus, useForm, useObservableRef } from '@cloudbeaver/core-blocks';
import { useScriptExportDialog, type IScriptExportTabProps } from '@cloudbeaver/plugin-script-export';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { downloadSql } from '../downloadSql.js';
import { NotificationService } from '@cloudbeaver/core-events';
import { useService } from '@cloudbeaver/core-di';

interface State {
  fileName: string;
  export: () => string;
}

export const LocalExportTab: TabContainerPanelComponent<IScriptExportTabProps> = observer(function LocalExportTab({
  script,
  fileName: initialFileName,
}) {
  const { resolveDialog, rejectDialog, FooterSlot } = useScriptExportDialog();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const notificationService = useService(NotificationService);

  const state = useObservableRef<State>(
    () => ({
      fileName: initialFileName,
    }),
    {
      fileName: observable.ref,
    },
    false,
  );
  const form = useForm({
    onSubmit() {
      downloadSql(state.fileName, script);
      resolveDialog();
      notificationService.logSuccess({
        title: 'sql_editor_script_exported',
        message: state.fileName,
      });
    },
  });

  const canSave = state.fileName.trim().length > 0;

  return (
    <>
      <Form ref={focusedRef} context={form} className="tw:p-6 tw:w-full">
        <InputField name="fileName" state={state} required small>
          <Translate token="ui_file_name" />
        </InputField>
      </Form>
      {FooterSlot && (
        <FooterSlot>
          <Button type="button" variant="secondary" onClick={() => rejectDialog()}>
            <Translate token="ui_processing_cancel" />
          </Button>
          <Fill />
          <Button type="button" disabled={!canSave} onClick={() => form.submit()}>
            <Translate token="ui_processing_save" />
          </Button>
        </FooterSlot>
      )}
    </>
  );
});
