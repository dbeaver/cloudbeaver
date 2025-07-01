/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Cell, IconOrImage, useTranslate } from '@cloudbeaver/core-blocks';
import { observer } from 'mobx-react-lite';
import { useService } from '@cloudbeaver/core-di';
import { SqlEditorBootstrap } from './SqlEditorBootstrap.js';
import { ACTION_SQL_EDITOR_NEW } from './ACTION_SQL_EDITOR_NEW.js';

export const WelcomeNewSqlEditor = observer(function WelcomeNewSqlEditor() {
  const sqlEditorBootstrap = useService(SqlEditorBootstrap);
  const translate = useTranslate();
  return (
    <Cell
      before={<IconOrImage icon="/icons/sql_script.svg" />}
      description={translate(ACTION_SQL_EDITOR_NEW.info.tooltip)}
      className="tw:cursor-pointer tw:rounded-sm tw:overflow-hidden"
      big
      onClick={() => sqlEditorBootstrap.openSQLEditor()}
    >
      {translate(ACTION_SQL_EDITOR_NEW.info.label)}
    </Cell>
  );
});
