/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { DBObject } from '@cloudbeaver/core-app';
import { ComplexLoader, createComplexLoader, Loader } from '@cloudbeaver/core-blocks';

const loader = createComplexLoader(async function loader() {
  const { Table } = await import('./Table');
  return { Table };
});

interface Props {
  objects: DBObject[];
  truncated?: boolean;
}

export const TableLoader: React.FC<Props> = function TableLoader(props) {
  return (
    <ComplexLoader
      loader={loader}
      placeholder={<Loader />}
    >
      {({ Table }) => (
        <Table {...props} />
      )}
    </ComplexLoader>
  );
};
