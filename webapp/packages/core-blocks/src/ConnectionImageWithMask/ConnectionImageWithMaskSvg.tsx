/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { GlobalConstants, isValidUrl } from '@cloudbeaver/core-utils';

import { useS } from '../useS.js';
import style from './ConnectionImageWithMaskSvg.module.css';

interface Props {
  icon?: string;
  connected: boolean;
  maskId: string;
  size?: number;
  markerRadius?: number;
  paddingSize?: number;
  className?: string;
}

export const ConnectionImageWithMaskSvg: React.FC<Props> = ({ icon, connected, maskId, size = 16, markerRadius = 4, paddingSize = 0, className }) => {
  const styles = useS(style);
  if (!icon) {
    return null;
  }

  const circleOffset = 2;
  const rectOffset = 1;
  const circleParams = {
    coordinate: size - markerRadius + paddingSize,
    radius: markerRadius + circleOffset + paddingSize,
  };
  const rectParams = {
    coordinate: size - markerRadius + paddingSize,
    size: markerRadius + rectOffset + paddingSize,
  };
  const url = isValidUrl(icon) ? icon : GlobalConstants.absoluteUrl(icon);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <mask id={maskId}>
        <rect fill="#fff" x="0" y="0" width={size} height={size} />
        <circle fill="#000" cx={circleParams.coordinate} cy={circleParams.coordinate} r={circleParams.radius} />
        <rect
          fill="#000"
          x={rectParams.coordinate}
          y={rectParams.coordinate}
          width={rectParams.size}
          height={rectParams.size}
          mask={`url(#${maskId})`}
        />
      </mask>
      <rect className={styles['background']} x="0" y="0" width={size} height={size} mask={connected ? `url(#${maskId})` : undefined} />
      <image xlinkHref={url} width={size} height={size} mask={connected ? `url(#${maskId})` : undefined} />
    </svg>
  );
};
