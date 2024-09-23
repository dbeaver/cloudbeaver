/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionImageWithMaskSvg } from './ConnectionImageWithMaskSvg.js';
import { ConnectionMark } from './ConnectionMark.js';

interface Props {
  icon?: string;
  connected: boolean;
  maskId: string;
  size?: number;
  markerRadius?: number;
  paddingSize?: number;
  className?: string;
}

export const ConnectionImageWithMask: React.FC<Props> = ({ icon, connected, maskId, size, markerRadius, paddingSize, className }) => (
  <>
    <ConnectionImageWithMaskSvg
      icon={icon}
      connected={connected}
      maskId={maskId}
      size={size}
      markerRadius={markerRadius}
      paddingSize={paddingSize}
      className={className}
    />
    <ConnectionMark connected={connected} />
  </>
);
