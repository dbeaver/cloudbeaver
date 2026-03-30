/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type React from 'react';
import { UnstyledButton, type UnstyledButtonProps } from '@dbeaver/ui-kit';

import { Icon } from './Icon.js';
import IconButtonStyles from './IconButton.module.css';
import { s } from './s.js';
import { StaticImage } from './StaticImage.js';
import { useS } from './useS.js';

interface Props {
  name: string;
  img?: boolean;
  viewBox?: string;
}

export type IconButtonProps = Props & UnstyledButtonProps;

export const IconButton: React.FC<IconButtonProps> = observer(function IconButton({ name, img, viewBox, className, ...rest }) {
  const styles = useS(IconButtonStyles);

  return (
    <UnstyledButton tabIndex={0} {...rest} className={s(styles, { iconButton: true }, className)}>
      <div className={s(styles, { iconBox: true })}>
        {img && <StaticImage className={s(styles, { staticImage: true })} icon={name} />}
        {!img && <Icon className={s(styles, { icon: true })} name={name} viewBox={viewBox} />}
      </div>
    </UnstyledButton>
  );
});
