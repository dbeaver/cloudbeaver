/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

interface Props {
  className?: string;
  srcGetter: () => string | null;
  onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
}

export const ImageRenderer = observer<Props>(function ImageRenderer({ srcGetter, className, onContextMenu }) {
  const src = srcGetter();

  if (!src) {
    return null;
  }

  return <img src={src} className={className} onContextMenu={onContextMenu} />;
});
