/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PropertiesTable, useResource } from '@cloudbeaver/core-blocks';
import { SQLCodeEditor, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-codemirror';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import { observer } from 'mobx-react-lite';
import { useService } from '@cloudbeaver/core-di';
import { SqlEditorSettingsService } from './SqlEditorSettingsService.js';
import { ConnectionDialectResource, type IConnectionInfoParams } from '@cloudbeaver/core-connections';

export function renderQueryParamsForConfirmation(
  connectionKey: IConnectionInfoParams | null,
  parameters: Record<string, any>,
  query: string,
): React.ReactElement {
  return <RenderParametersForm parameters={parameters} query={query} connectionKey={connectionKey} />;
}

const RenderParametersForm = observer(function RenderParametersForm({
  parameters,
  query,
  connectionKey,
}: {
  query: string;
  parameters: Record<string, any>;
  connectionKey: IConnectionInfoParams | null;
}) {
  const sqlEditorSettingsService = useService(SqlEditorSettingsService);
  const connectionDialectResource = useResource(RenderParametersForm, ConnectionDialectResource, connectionKey);
  const sqlDialect = useSqlDialectExtension(connectionDialectResource.data);
  const extensions = useCodemirrorExtensions();
  if (sqlDialect) {
    extensions.set(...sqlDialect);
  }

  for (const [paramName, paramValue] of Object.entries(parameters)) {
    const paramValueString = String(paramValue);
    if (paramValueString) {
      if (sqlEditorSettingsService.parameterEnabled) {
        query = query.replaceAll(`:${paramName}`, paramValueString);
      }

      if (sqlEditorSettingsService.variablesEnabled) {
        query = query.replaceAll(`$\{${paramName}}`, paramValueString);
      }
    }
  }

  return (
    <div className="tw:flex tw:flex-col tw:overflow-auto tw:gap-3 tw:min-h-full">
      <div className="tw:overflow-auto tw:flex-auto tw:flex">
        <PropertiesTable
          properties={Object.keys(parameters).map(paramName => ({
            id: paramName,
            key: paramName,
            displayName: paramName,
            defaultValue: '',
          }))}
          propertiesState={parameters}
          className="tw:overflow-auto"
          staticProperties
        />
      </div>

      {!sqlEditorSettingsService.disabled && (
        <SQLCodeEditor value={query} extensions={extensions} className="tw:overflow-auto tw:flex-1/3" readonly />
      )}
    </div>
  );
});
