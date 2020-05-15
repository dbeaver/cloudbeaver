/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { PlaceholderContainer } from './PlaceholderContainer';

type Props<T = unknown> = T extends unknown ? {
  container: PlaceholderContainer<T>;
  context?: T;
} : {
  container: PlaceholderContainer<T>;
  context: T;
}

export const Placeholder = observer(function Placeholder<T = unknown>({ container, context }: Props<T>) {
  return (
    <>
      {container.get().map(({ id, component: Component }) => <Component key={id} context={context!} />)}
    </>
  );
});
