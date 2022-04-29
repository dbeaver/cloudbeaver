/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { ConnectDragPreview, DragPreviewImage } from 'react-dnd';

import type { IDNDData } from './useDNDData';

interface Props {
  src: string;
  data: IDNDData;
}

export const DNDPreview = observer<Props>(function DNDPreview({ src, data }) {

  return (<DragPreviewImage connect={data.setPreviewRef as ConnectDragPreview} src={src} />);
});