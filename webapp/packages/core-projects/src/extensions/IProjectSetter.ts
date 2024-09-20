/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createExtension, type IExtension, isExtension } from '@cloudbeaver/core-extensions';

const projectSetterSymbol = Symbol('@extension/ProjectSetter');

export type IProjectSetter<T = never> = (projectId: string | null, context: T) => Promise<boolean> | boolean;

export function projectSetter<T>(setter: IProjectSetter<T>) {
  return createExtension<T>(setter, projectSetterSymbol);
}

export function isProjectSetter<T>(obj: IExtension<T>): obj is IProjectSetter<T> & IExtension<T> {
  return isExtension(obj, projectSetterSymbol);
}
