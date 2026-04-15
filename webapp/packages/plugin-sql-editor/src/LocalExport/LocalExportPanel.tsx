/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { InputField, Translate, useForm } from '@cloudbeaver/core-blocks';
import { ExportScriptDialogContext, type IScriptExportTabProps } from '@cloudbeaver/plugin-script-export';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { downloadSql } from '../downloadSql.js';
import { withTimestamp } from '@cloudbeaver/core-utils';
import { useState, useContext } from 'react';

export const LocalExportPanel: TabContainerPanelComponent<IScriptExportTabProps> = observer(function LocalExportPanel({
  script,
  fileName: initialFileName,
}) {
  const dialogContext = useContext(ExportScriptDialogContext);
  const [fileName, setFileName] = useState(initialFileName);

  useForm({
    onSubmit() {
      const fileNameWithTimestamp = withTimestamp(fileName);
      downloadSql(fileNameWithTimestamp, script);

      dialogContext?.resolveDialog();
    },
  });

  return (
    <InputField className="tw:max-w-80!" name="fileName" value={fileName} required onChange={setFileName}>
      <Translate token="ui_file_name" />
    </InputField>
  );
});
