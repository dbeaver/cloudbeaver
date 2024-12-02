/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { type ConnectDragPreview, DragPreviewImage } from 'react-dnd';

import type { IDNDData } from './useDNDData.js';

export interface DNDPreviewProps {
  src: string;
  data: IDNDData;
}

export const DNDPreview = observer<DNDPreviewProps>(function DNDPreview({ src, data }) {
  return <DragPreviewImage connect={data.setPreviewRef as ConnectDragPreview} src={src} />;
});
