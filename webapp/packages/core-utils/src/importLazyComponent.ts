/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

export function importLazyComponent<TComponent extends React.FC<any>>(componentImporter: () => Promise<TComponent>) {
  return React.lazy<TComponent>(async () => {
    const component = await componentImporter();
    return { default: component };
  });
}
