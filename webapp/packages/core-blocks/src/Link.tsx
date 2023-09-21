/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { IconOrImage } from './IconOrImage';
import style from './Link.m.css';
import { s } from './s';
import { useS } from './useS';

interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  wrapper?: boolean;
  indicator?: boolean;
  inline?: boolean;
  children?: React.ReactNode;
}

export const Link = observer<Props>(function Link({ inline, wrapper, indicator, className, children, ...rest }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { linkContainer: true, inline }, className)}>
      <a className={s(styles, { link: true, wrapper })} {...rest}>
        {indicator && <IconOrImage className={s(styles, { iconOrImage: true })} icon="external-link" />}
        {children}
      </a>
    </div>
  );
});
