/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css, use } from 'reshadow';

interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  wrapper?: boolean;
}

const styles = css`
  a {
    cursor: pointer;
  }
  a[|wrapper] {
    &, &:hover, &:focus, &:active {
      color: inherit;
      text-decoration: none;
      outline: none;
    }
  }
`;

export const Link: React.FC<Props> = function Link({
  wrapper,
  className,
  children,
  ...rest
}) {
  return styled(styles)(
    <div className={className}>
      <a {...use({ wrapper })} {...rest}>{children}</a>
    </div>
  );
};
