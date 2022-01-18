/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export const VirtualFolderUtils = {
  prefix: 'object-viewer://virtual-folder/',

  getFolderId(nodeType: string): string {
    return this.prefix + nodeType;
  },

  getNodeType(folderId: string): string {
    return folderId.replace(this.prefix, '');
  },

  isVirtualFolder(folderId: string): boolean {
    return folderId.startsWith(this.prefix);
  },
};
