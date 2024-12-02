/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { IconOrImage } from './IconOrImage.js';
import style from './Link.module.css';
import { s } from './s.js';
import { useS } from './useS.js';

interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  wrapper?: boolean;
  indicator?: boolean;
  inline?: boolean;
  truncate?: boolean;
  children?: React.ReactNode;
}

export const Link = observer<Props>(function Link({ inline, wrapper, indicator, truncate, className, children, ...rest }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { linkContainer: true, inline, truncate }, className)}>
      <a className={s(styles, { link: true, wrapper })} {...rest}>
        {indicator && <IconOrImage className={s(styles, { iconOrImage: true })} icon="external-link" />}
        {children}
      </a>
    </div>
  );
});
