/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isResourceOfType } from './isResourceOfType.js';
import type { ProjectInfoResourceType } from './ProjectInfoResource.js';

export function createResourceOfType(resourceType: ProjectInfoResourceType, name: string): string {
  if (isResourceOfType(resourceType, name)) {
    return name;
  }

  const extension = resourceType.fileExtensions[0];
  return `${name}${extension ? '.' + extension : ''}`;
}
