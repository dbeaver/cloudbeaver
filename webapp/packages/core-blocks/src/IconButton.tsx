/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type React from 'react';
import { type UiKitButtonProps, Button as UIKitButton } from '@dbeaver/ui-kit';

import { Icon } from './Icon.js';
import IconButtonStyles from './IconButton.module.css';
import { s } from './s.js';
import { StaticImage } from './StaticImage.js';
import { useS } from './useS.js';

export interface IconButtonProps extends UiKitButtonProps {
  name: string;
  img?: boolean;
  viewBox?: string;
}

export const IconButton: React.FC<IconButtonProps> = observer(function IconButton({ name, img, viewBox, className, ...rest }: IconButtonProps) {
  const styles = useS(IconButtonStyles);

  return (
    <UIKitButton {...rest} className={s(styles, { iconButton: true }, className)}>
      <div className={s(styles, { iconBox: true })}>
        {img && <StaticImage className={s(styles, { staticImage: true })} icon={name} />}
        {!img && <Icon className={s(styles, { icon: true })} name={name} viewBox={viewBox} />}
      </div>
    </UIKitButton>
  );
});
