/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useRef } from 'react';

export function useObjectRef<T>(init: T, update?: Partial<T>): T {
  const ref = useRef(init);

  if (update) {
    Object.assign(ref.current, update);
  } else {
    Object.assign(ref.current, init);
  }

  return ref.current;
}
