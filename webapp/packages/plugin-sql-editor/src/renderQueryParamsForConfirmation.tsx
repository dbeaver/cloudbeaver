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

const REGEXP_META_CHARS_PATTERN = /[.*+?^${}()|[\]\\]/g;

function escapeForRegExp(value: string): string {
  return value.replace(REGEXP_META_CHARS_PATTERN, '\\$&');
}

function getNamedParameterPattern(escapedName: string): string {
  return `:${escapedName}\\b`;
}

function getVariableParameterPattern(escapedName: string): string {
  return `\\$\\{${escapedName}\\}`;
}

function replaceQueryToken(query: string, pattern: string, value: string): string {
  return query.replace(new RegExp(pattern, 'g'), value);
}

export function renderQueryParamsForConfirmation(
  connectionKey: IConnectionInfoParams | null,
  parameters: Record<string, any>,
  query: string,
  orderedParameters: string[],
): React.ReactElement {
  return <RenderParametersForm parameters={parameters} query={query} connectionKey={connectionKey} orderedParameters={orderedParameters} />;
}

const RenderParametersForm = observer(function RenderParametersForm({
  parameters,
  query,
  connectionKey,
  orderedParameters,
}: {
  query: string;
  parameters: Record<string, any>;
  connectionKey: IConnectionInfoParams | null;
  orderedParameters: string[];
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
      const escapedName = escapeForRegExp(paramName);

      if (sqlEditorSettingsService.parameterEnabled) {
        query = replaceQueryToken(query, getNamedParameterPattern(escapedName), paramValueString);
      }

      if (sqlEditorSettingsService.variablesEnabled) {
        query = replaceQueryToken(query, getVariableParameterPattern(escapedName), paramValueString);
      }
    }
  }

  return (
    <div className="tw:flex tw:flex-col tw:overflow-auto tw:gap-3 tw:min-h-full">
      <div className="tw:overflow-auto tw:flex-auto tw:flex">
        <PropertiesTable
          properties={orderedParameters.map((paramName, index) => ({
            id: `${index}:${paramName}`,
            key: paramName,
            displayName: paramName,
            description: paramName,
            defaultValue: '',
          }))}
          propertiesState={parameters}
          className="tw:overflow-auto"
          sortByName={false}
          staticProperties
        />
      </div>

      {!sqlEditorSettingsService.disabled && (
        <SQLCodeEditor value={query} extensions={extensions} className="tw:overflow-auto tw:flex-1/3" readonly />
      )}
    </div>
  );
});
