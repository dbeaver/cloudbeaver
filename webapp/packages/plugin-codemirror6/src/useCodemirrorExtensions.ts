/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Compartment, type Extension } from '@codemirror/state';
import { useState } from 'react';

export function useCodemirrorExtensions(extensions?: Map<Compartment, Extension>, staticExtensions?: Extension): Map<Compartment, Extension> {
  const [compartment] = useState(() => new Compartment());
  const map = new Map(extensions?.entries());
  map.set(compartment, staticExtensions || []);
  return map;
}
