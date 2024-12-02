/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { IconOrImage } from '../IconOrImage.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './Tags.module.css';

export interface ITag<T extends string | number = string> {
  id: T;
  label: string;
  icon?: string;
}

interface Props<T extends string | number> extends ITag<T> {
  onRemove: (id: T) => void;
  className?: string;
}

export const Tag = observer(function Tag<T extends string | number>({ id, label, icon, onRemove, className }: Props<T>) {
  const styles = useS(style);

  return (
    <li title={label} className={s(styles, { tagContainer: true }, className)}>
      {icon && (
        <div className={s(styles, { tagIcon: true })}>
          <IconOrImage icon={icon} className={s(styles, { iconOrImage: true })} />
        </div>
      )}
      <div className={s(styles, { tagContent: true })}>{label}</div>
      <div className={s(styles, { tagActions: true })}>
        <div className={s(styles, { tagAction: true })} onClick={() => onRemove(id)}>
          <IconOrImage className={s(styles, { iconOrImage: true })} icon="cross" />
        </div>
      </div>
    </li>
  );
});
