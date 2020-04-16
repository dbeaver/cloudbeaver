/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PropsWithChildren } from 'react';

import { ObjectViewer } from './ObjectViewer';

type ViewerProps = PropsWithChildren<{
  tabId: string;
  handlerId: string;
}>

export function Viewer({ tabId }: ViewerProps) {
  return <ObjectViewer objectId={tabId} />;
}
