/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ReactNode } from 'react';

import { Card, s, useS } from '@cloudbeaver/core-blocks';

import styles from './AuthenticationOptionCard.module.css';

interface Props {
  controlId: string;
  label: string;
  description?: string;
  disabled?: boolean;
  title?: string;
  iconSlot: ReactNode;
  typeSlot?: ReactNode;
  controlSlot: ReactNode;
  actionsSlot?: ReactNode;
}

export const AuthenticationOptionCard: React.FC<Props> = function AuthenticationOptionCard({
  controlId,
  label,
  description,
  disabled,
  title,
  iconSlot,
  typeSlot,
  controlSlot,
  actionsSlot,
}) {
  const classes = useS(styles);
  const labelId = `${controlId}-label`;
  const descriptionId = `${controlId}-description`;

  return (
    <Card role="listitem" aria-labelledby={labelId} className={s(classes, { card: true })} data-disabled={disabled || undefined} title={title}>
      <div className={s(classes, { header: true })}>
        <div className={s(classes, { identity: true })}>
          <div className={s(classes, { avatar: true })} aria-hidden="true">
            {iconSlot}
          </div>
          <div className={s(classes, { heading: true })}>
            <label id={labelId} className={s(classes, { name: true })} htmlFor={controlId}>
              {label}
            </label>
            {typeSlot && <span className={s(classes, { type: true })}>{typeSlot}</span>}
          </div>
        </div>
        <div className={s(classes, { toggle: true })}>{controlSlot}</div>
      </div>
      {(description || actionsSlot) && (
        <div className={s(classes, { content: true })}>
          {description && (
            <p id={descriptionId} className={s(classes, { description: true })}>
              {description}
            </p>
          )}
          {actionsSlot && <div className={s(classes, { actions: true })}>{actionsSlot}</div>}
        </div>
      )}
    </Card>
  );
};
