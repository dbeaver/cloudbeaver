/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React, { type ComponentType } from 'react';

export function importLazyComponent<TComponent extends ComponentType<any>>(componentImporter: () => Promise<TComponent>): TComponent {
  return React.lazy<TComponent>(async () => {
    const component = await componentImporter();
    return { default: component };
  }) as any;
}
