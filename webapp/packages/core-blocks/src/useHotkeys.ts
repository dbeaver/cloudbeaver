/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useHotkeys as useHotkeysHook } from '@dbeaver/react-hotkeys';

type FormTags = 'input' | 'textarea' | 'select' | 'INPUT' | 'TEXTAREA' | 'SELECT';
type Keys = string | readonly string[];
type Scopes = string | readonly string[];
type KeyboardModifiers = {
  alt?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  mod?: boolean;
  useKey?: boolean;
};
export type Hotkey = KeyboardModifiers & {
  keys?: readonly string[];
  hotkey?: string;
  metadata?: Record<string, unknown>;
  scopes?: Scopes;
  description?: string;
  isSequence?: boolean;
};
type HotkeysEvent = Hotkey;
type HotkeyCallback = (keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => void;
type Trigger = boolean | ((keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => boolean);
type Options = {
  enabled?: Trigger;
  enableOnFormTags?: readonly FormTags[] | boolean;
  enableOnContentEditable?: boolean;
  ignoreEventWhen?: (e: KeyboardEvent) => boolean;
  splitKey?: string;
  delimiter?: string;
  scopes?: Scopes;
  keyup?: boolean;
  keydown?: boolean;
  preventDefault?: Trigger;
  description?: string;
  document?: Document;
  ignoreModifiers?: boolean;
  eventListenerOptions?: EventListenerOptions;
  useKey?: boolean;
  sequenceTimeoutMs?: number;
  sequenceSplitKey?: string;
};
type OptionsOrDependencyArray = Options | React.DependencyList;

export function useHotkeys<T extends HTMLElement>(
  keys: Keys,
  callback: HotkeyCallback,
  options?: OptionsOrDependencyArray,
  dependencies?: OptionsOrDependencyArray,
): React.RefObject<T | null> {
  return useHotkeysHook(keys, callback, options, dependencies);
}
