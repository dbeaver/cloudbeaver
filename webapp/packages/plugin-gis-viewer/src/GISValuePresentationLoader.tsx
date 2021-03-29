/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ComplexLoader, Loader } from '@cloudbeaver/core-blocks';
import type { IDatabaseDataModel, IDatabaseResultSet } from '@cloudbeaver/plugin-data-viewer';

async function loader() {
  const { GISValuePresentation } = await import('./GISValuePresentation');
  return { GISValuePresentation };
}

interface Props {
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  resultIndex: number;
}

export const GISValuePresentationLoader: React.FC<Props> = function GISValuePresentationLoader({ model, resultIndex }) {
  return (
    <ComplexLoader
      loader={loader}
      placeholder={<Loader />}
    >
      {({ GISValuePresentation }) => (
        <GISValuePresentation model={model} resultIndex={resultIndex} />
      )}
    </ComplexLoader>
  );
}
;
