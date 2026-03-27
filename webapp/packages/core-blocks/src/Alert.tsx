/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PropsWithChildren } from 'react';
import { observer } from 'mobx-react-lite';

import { useTranslate } from './localization/useTranslate.js';
import { IconOrImage } from './IconOrImage.js';

type Size = 'small' | 'medium' | 'large';

interface Props {
  title?: string;
  variant?: 'info' | 'error';
  size?: Size;
  className?: string;
}

export const Alert = observer<PropsWithChildren<Props>>(function Alert({ title, variant = 'info', size = 'medium', className, children }) {
  const translate = useTranslate();
  const icon = variant === 'info' ? '/icons/preload/info_icon_sm.svg' : '/icons/preload/error_icon_sm.svg';
  const sizeClasses: Record<Size, string> = {
    small: 'tw:gap-2.5 tw:p-3',
    medium: 'tw:gap-3.5 tw:p-4',
    large: 'tw:gap-[18px] tw:p-5',
  };
  const iconSizes: Record<Size, string> = {
    small: 'tw:size-4',
    medium: 'tw:size-5',
    large: 'tw:size-6',
  };
  const titleSizes: Record<Size, string> = {
    small: 'tw:text-sm',
    medium: '',
    large: 'tw:text-lg',
  };

  const bgColor = variant === 'info' ? 'tw:bg-[rgba(34,139,230,0.15)]' : 'tw:bg-[rgba(255,77,79,0.15)]';
  const titleColor = variant === 'info' ? 'tw:text-[color:var(--theme-primary)]' : 'tw:text-[color:var(--theme-error)]';

  return (
    <div className={`tw:flex tw:items-start tw:rounded ${bgColor} ${sizeClasses[size]} ${className || ''}`} role="alert">
      <IconOrImage icon={icon} className={`tw:mt-0.5 ${iconSizes[size]}`} />
      <div className="tw:flex tw:flex-col tw:gap-2">
        <h3 className={`tw:font-medium tw:m-0 ${titleColor} ${titleSizes[size]}`}>
          {title ?? translate(variant === 'info' ? 'ui_information' : 'ui_error')}
        </h3>
        {children}
      </div>
    </div>
  );
});
