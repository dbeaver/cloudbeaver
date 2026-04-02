/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { Container, Form, InputField, Translate, useFocus, useObservableRef } from '@cloudbeaver/core-blocks';
import type { IScriptExportTabProps } from '@cloudbeaver/plugin-script-export';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { downloadSql } from '../downloadSql.js';

interface State {
  fileName: string;
  export: () => string;
}

export const LocalExportTab: TabContainerPanelComponent<IScriptExportTabProps> = observer(function LocalExportTab({
  script,
  fileName: initialFileName,
  registerScriptExportController,
}) {
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  const state = useObservableRef<State>(
    () => ({
      fileName: initialFileName,
      export() {
        downloadSql(this.fileName, script);
        return this.fileName;
      },
    }),
    {
      fileName: observable.ref,
      export: action.bound,
    },
    false,
  );

  useEffect(() => {
    registerScriptExportController?.({
      export: state.export,
      canExport: () => state.fileName.trim().length > 0,
      isExporting: () => false,
    });
  }, [registerScriptExportController, state.export, state.fileName]);

  return (
    <Container gap vertical>
      <Form ref={focusedRef}>
        <Container gap>
          <InputField name="fileName" state={state}>
            <Translate token="ui_file_name" />
          </InputField>
        </Container>
      </Form>
    </Container>
  );
});
