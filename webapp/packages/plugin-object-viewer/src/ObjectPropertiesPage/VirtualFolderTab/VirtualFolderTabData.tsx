/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export class VirtualFolderTabData {
  constructor(
    public readonly nodeId: string,
    public readonly folderName: string,
    public readonly childrenIds: string[]
  ) {}
}
