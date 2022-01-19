/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { PlaceholderContainer } from './PlaceholderContainer';

type Props<T extends Record<string, any>> = T & {
  container: PlaceholderContainer<T>;
};

export const Placeholder = observer(function Placeholder<T extends Record<string, any>>({
  container,
  ...rest
}: Props<T>) {
  return (
    <>
      {container.get().map(({ id, component: Component }) => <Component key={id} {...(rest as any as T)} />)}
    </>
  );
});
