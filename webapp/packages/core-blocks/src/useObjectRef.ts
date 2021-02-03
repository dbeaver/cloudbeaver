/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useRef } from 'react';

export function useObjectRef<T>(init: T, update?: Partial<T>): React.MutableRefObject<T> {
  const ref = useRef(init);

  if (update) {
    ref.current = {
      ...ref.current,
      update,
    };
  } else {
    ref.current = {
      ...ref.current,
      ...init,
    };
  }

  return ref;
}
