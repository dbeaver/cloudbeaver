/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ComplexLoader, createComplexLoader, Loader } from '@cloudbeaver/core-blocks';

const loader = createComplexLoader(async function loader() {
  const { ReactSanitizedHTML } = await import('./ReactSanitizedHTML');
  return { ReactSanitizedHTML };
});

interface Props {
  html: string;
}

export const SanitizedHTML: React.FC<Props> = function SanitizedHTML({ html }) {
  return (
    <ComplexLoader
      loader={loader}
      placeholder={<Loader />}
    >
      {({ ReactSanitizedHTML }) => (
        <ReactSanitizedHTML html={html} />
      )}
    </ComplexLoader>
  );
};
