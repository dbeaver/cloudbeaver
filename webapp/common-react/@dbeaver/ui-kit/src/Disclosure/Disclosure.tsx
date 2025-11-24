/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  Disclosure as AriakitDisclosure,
  DisclosureContent as AriakitDisclosureContent,
  DisclosureProvider,
  type DisclosureProps,
  type DisclosureContentProps,
  type DisclosureProviderProps,
  type DisclosureStore,
  type DisclosureStoreProps,
  type DisclosureStoreState,
  useDisclosureContext,
  useDisclosureStore,
} from '@ariakit/react';
import clsx from 'clsx';
import type { JSX } from 'react';

import './Disclosure.css';

function Disclosure({ className, ...props }: DisclosureProps): JSX.Element {
  return <AriakitDisclosure className={clsx('dbv-kit-disclosure__disclosure', className)} {...props} />;
}

function DisclosureContent({ className, ...props }: DisclosureContentProps): JSX.Element {
  return <AriakitDisclosureContent className={clsx('dbv-kit-disclosure__content', className)} {...props} />;
}

export {
  Disclosure,
  DisclosureProvider,
  DisclosureContent,
  useDisclosureContext,
  useDisclosureStore,
  type DisclosureProps,
  type DisclosureProviderProps,
  type DisclosureContentProps,
  type DisclosureStore,
  type DisclosureStoreProps,
  type DisclosureStoreState,
};
