/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Icon, IconOrImage, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import styles from './CommonDialogHeader.m.css';

interface Props {
  title?: string;
  subTitle?: string | React.ReactNode;
  tooltip?: string;
  icon?: string;
  viewBox?: string;
  bigIcon?: boolean;
  onReject?: () => void;
  className?: string;
  style?: ComponentStyle;
}

export const CommonDialogHeader = observer<Props>(function CommonDialogHeader({
  title,
  subTitle,
  tooltip,
  icon,
  viewBox,
  bigIcon,
  className,
  onReject,
  style,
}) {
  const translate = useTranslate();
  const computedStyles = useS(styles, style);

  return (
    <header title={tooltip} className={s(computedStyles, { header: true }, className)}>
      <div className={s(computedStyles, { iconContainer: true })}>
        {icon && <IconOrImage className={s(computedStyles, { icon: true, bigIcon })} icon={icon} viewBox={viewBox} />}
      </div>
      <div className={s(computedStyles, { headerTitleContainer: true })}>
        <h3 className={s(computedStyles, { headerTitle: true })}>{translate(title)}</h3>
        {onReject && (
          <div className={s(computedStyles, { reject: true })}>
            <Icon name="cross" viewBox="0 0 16 16" onClick={onReject} />
          </div>
        )}
      </div>
      {subTitle && <div className={s(computedStyles, { subTitle: true })}>{typeof subTitle === 'string' ? translate(subTitle) : subTitle}</div>}
    </header>
  );
});
