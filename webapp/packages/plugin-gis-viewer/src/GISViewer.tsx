/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { createComplexLoader, ComplexLoader, Loader } from '@cloudbeaver/core-blocks';
import type { IDataValuePanelProps, IDatabaseResultSet } from '@cloudbeaver/plugin-data-viewer';

const loader = createComplexLoader(async function loader() {
  const { GISValuePresentation } = await import('./GISValuePresentation');
  return { GISValuePresentation };
});

export const GISViewer: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = function GISViewer({ model, resultIndex }) {
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
};
