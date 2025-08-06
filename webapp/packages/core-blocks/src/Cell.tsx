/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import style from './Cell.module.css';
import { Container } from './Containers/Container.js';
import { s } from './s.js';
import { useS } from './useS.js';
import { useId } from 'react';

interface BaseProps {
  description?: React.ReactElement | string;
  before?: React.ReactElement;
  after?: React.ReactElement;
  ripple?: boolean;
  big?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface ButtonProps extends BaseProps {
  as?: 'button';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  href?: never;
  target?: never;
}

interface DivProps extends BaseProps {
  as: 'div';
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  href?: never;
  target?: never;
}

interface LinkProps extends BaseProps {
  as: 'a';
  href?: string;
  target?: string;
  onClick?: never;
}

type Props = ButtonProps | DivProps | LinkProps;

export const Cell = observer<Props>(function Cell({
  before,
  after,
  description,
  className,
  ripple = true,
  big,
  as = 'button',
  href,
  target,
  onClick,
  children,
}) {
  const styles = useS(style);
  const Tag = as;
  const descriptionId = useId();

  return (
    <Tag
      aria-labelledby={descriptionId}
      href={href}
      target={target}
      className={s(styles, { ripple, big, full: true }, className)}
      onClick={onClick as any}
    >
      <Container className={s(styles, { main: true })} gap parent center dense>
        {before && (
          <Container className={s(styles, { before: true })} keepSize>
            {before}
          </Container>
        )}
        <Container className={s(styles, { info: true })} zeroBasis>
          {children}
          {description && (
            <Container id={descriptionId} className={s(styles, { description: true })}>
              {description}
            </Container>
          )}
        </Container>
        {after && (
          <Container className={s(styles, { after: true })} keepSize>
            {after}
          </Container>
        )}
      </Container>
    </Tag>
  );
});
