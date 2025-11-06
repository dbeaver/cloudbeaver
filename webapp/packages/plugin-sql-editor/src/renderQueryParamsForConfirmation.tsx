/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Container, InputField } from '@cloudbeaver/core-blocks';
import { observer } from 'mobx-react-lite';

export function renderQueryParamsForConfirmation(parameters: Record<string, any>, query: string): React.ReactElement {
  return <RenderParametersForm parameters={parameters} query={query} />;
}

const RenderParametersForm = observer(function RenderParametersForm({ parameters }: { query: string; parameters: Record<string, any> }) {
  return (
    <Container wrap gap>
      {Object.keys(parameters).map(paramName => (
        <InputField key={paramName} name={paramName} state={parameters} fill>
          {paramName}
        </InputField>
      ))}
    </Container>
  );
});
