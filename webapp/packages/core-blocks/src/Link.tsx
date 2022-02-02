/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css, use } from 'reshadow';

import { IconOrImage } from './IconOrImage';

interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  wrapper?: boolean;
  indicator?: boolean;
}

const styles = css`
  a {
    position: relative;
    cursor: pointer;
  }
  a[|wrapper] {
    &, &:hover, &:focus, &:active {
      color: inherit;
      text-decoration: none;
      outline: none;
    }
  }
  IconOrImage {
    position: absolute;
    width: 8px;
    left: calc(100% + 4px);
  }
`;

export const Link: React.FC<Props> = function Link({
  wrapper,
  indicator,
  className,
  children,
  ...rest
}) {
  return styled(styles)(
    <div className={className}>
      <a
        {...use({ wrapper })}
        {...rest}
      >
        {indicator && <IconOrImage icon='external-link' />}
        {children}
      </a>
    </div>
  );
};
