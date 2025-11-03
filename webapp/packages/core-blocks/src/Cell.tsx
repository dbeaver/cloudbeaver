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
import { Clickable, type ReakitComponent } from './Clickable.js';
import type { ClickableOptions } from 'reakit';

interface Props extends ClickableOptions {
  description?: React.ReactNode | string;
  before?: React.ReactElement;
  after?: React.ReactElement;
  ripple?: boolean;
  big?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Cell: ReakitComponent<'div', Props> = observer(function Cell({
  as: asElement,
  before,
  after,
  description,
  className,
  ripple = true,
  big,
  children,
  ...rest
}) {
  const styles = useS(style);

  return (
    <Clickable {...rest} as={asElement ?? 'div'} className={s(styles, { ripple, big }, className)}>
      <Container className={s(styles, { main: true })} gap parent center dense>
        {before && (
          <Container className={s(styles, { before: true })} keepSize>
            {before}
          </Container>
        )}
        {(children || description) && (
          <Container className={s(styles, { info: true })} zeroBasis>
            {children}
            {description && <Container className={s(styles, { description: true })}>{description}</Container>}
          </Container>
        )}
        {after && (
          <Container className={s(styles, { after: true })} keepSize>
            {after}
          </Container>
        )}
      </Container>
    </Clickable>
  );
}) as ReakitComponent<'div', Props>;
