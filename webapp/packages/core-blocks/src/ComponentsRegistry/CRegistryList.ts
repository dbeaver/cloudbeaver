/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { IComponentsTreeNodeValidator } from './IComponentsTreeNodeValidator';

export type RegistryEntry<T extends React.FC<T>> = [T, IComponentsTreeNodeValidator<T>[]];
export type CRegistryList = RegistryEntry<React.FC<any>>[];
