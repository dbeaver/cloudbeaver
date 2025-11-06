/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import * as Ariakit from '@ariakit/react';
import clsx from 'clsx';

import './Popover.css';

export function Popover({ children, ...props }: Ariakit.PopoverProviderProps) {
  return <Ariakit.PopoverProvider {...props}>{children}</Ariakit.PopoverProvider>;
}

export function PopoverDisclosure({ className, ...props }: Ariakit.PopoverDisclosureProps) {
  return <Ariakit.PopoverDisclosure className={clsx('dbv-kit-popover__disclosure', className)} {...props} />;
}

export function PopoverArrow({ className, ...props }: Ariakit.PopoverArrowProps) {
  return <Ariakit.PopoverArrow className={clsx('dbv-kit-popover__arrow', className)} {...props} />;
}

export function PopoverHeading({ className, ...props }: Ariakit.PopoverHeadingProps) {
  return <Ariakit.PopoverHeading className={clsx('dbv-kit-popover__heading', className)} {...props} />;
}

export function PopoverDescription({ className, ...props }: Ariakit.PopoverDescriptionProps) {
  return <Ariakit.PopoverDescription className={clsx('dbv-kit-popover__description', className)} {...props} />;
}

export function PopoverContent({ className, ...props }: Ariakit.PopoverProps) {
  return <Ariakit.Popover className={clsx('dbv-kit-popover__content', className)} {...props} />;
}

Popover.PopoverDisclosure = PopoverDisclosure;
Popover.PopoverArrow = PopoverArrow;
Popover.PopoverHeading = PopoverHeading;
Popover.PopoverDescription = PopoverDescription;
Popover.PopoverContent = PopoverContent;
