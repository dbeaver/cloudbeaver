/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { isBindingPressed, isHotkeyModifier, mapKey, parseHotkey, parseKeysHookInput } from './parseHotkey.js';
import type { IKeyBinding } from '../Action/KeyBinding/IKeyBinding.js';

vi.mock('../Action/KeyBinding/getCommonAndOSSpecificKeys.js', () => ({
  getCommonAndOSSpecificKeys: (binding: IKeyBinding) => (binding.keys ? [binding.keys] : []),
}));

// ---------------------------------------------------------------------------
// mapKey
// ---------------------------------------------------------------------------
describe('mapKey', () => {
  it('maps aliased keys', () => {
    expect(mapKey('esc')).toBe('escape');
    expect(mapKey('return')).toBe('enter');
    expect(mapKey(' ')).toBe('space');
    expect(mapKey('.')).toBe('period');
    expect(mapKey(',')).toBe('comma');
    expect(mapKey('-')).toBe('slash');
    expect(mapKey('`')).toBe('backquote');
    expect(mapKey('#')).toBe('backslash');
    expect(mapKey('+')).toBe('bracketright');
  });

  it('maps physical key codes for modifiers', () => {
    expect(mapKey('ShiftLeft')).toBe('shift');
    expect(mapKey('ShiftRight')).toBe('shift');
    expect(mapKey('AltLeft')).toBe('alt');
    expect(mapKey('AltRight')).toBe('alt');
    expect(mapKey('MetaLeft')).toBe('meta');
    expect(mapKey('MetaRight')).toBe('meta');
    expect(mapKey('OSLeft')).toBe('meta');
    expect(mapKey('OSRight')).toBe('meta');
    expect(mapKey('ControlLeft')).toBe('ctrl');
    expect(mapKey('ControlRight')).toBe('ctrl');
  });

  it('strips key/digit/numpad/arrow prefixes', () => {
    expect(mapKey('KeyA')).toBe('a');
    expect(mapKey('Digit1')).toBe('1');
    expect(mapKey('Numpad0')).toBe('0');
    expect(mapKey('ArrowUp')).toBe('up');
  });

  it('lowercases and trims unknown keys', () => {
    expect(mapKey('  Enter  ')).toBe('enter');
    expect(mapKey('A')).toBe('a');
  });
});

// ---------------------------------------------------------------------------
// isHotkeyModifier
// ---------------------------------------------------------------------------
describe('isHotkeyModifier', () => {
  it('returns true for modifier keywords', () => {
    expect(isHotkeyModifier('shift')).toBe(true);
    expect(isHotkeyModifier('alt')).toBe(true);
    expect(isHotkeyModifier('meta')).toBe(true);
    expect(isHotkeyModifier('mod')).toBe(true);
    expect(isHotkeyModifier('ctrl')).toBe(true);
  });

  it('returns false for regular keys', () => {
    expect(isHotkeyModifier('a')).toBe(false);
    expect(isHotkeyModifier('enter')).toBe(false);
    expect(isHotkeyModifier('escape')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseKeysHookInput
// ---------------------------------------------------------------------------
describe('parseKeysHookInput', () => {
  it('splits by comma by default', () => {
    expect(parseKeysHookInput('ctrl+a,ctrl+b')).toEqual(['ctrl+a', 'ctrl+b']);
  });

  it('uses a custom split key', () => {
    expect(parseKeysHookInput('ctrl+a|ctrl+b', '|')).toEqual(['ctrl+a', 'ctrl+b']);
  });

  it('returns single element array when no delimiter present', () => {
    expect(parseKeysHookInput('ctrl+a')).toEqual(['ctrl+a']);
  });
});

// ---------------------------------------------------------------------------
// parseHotkey
// ---------------------------------------------------------------------------
describe('parseHotkey', () => {
  it('parses a simple key with no modifiers', () => {
    const result = parseHotkey('a');
    expect(result).toMatchObject({ alt: false, ctrl: false, shift: false, meta: false, mod: false, keys: ['a'] });
  });

  it('parses ctrl modifier', () => {
    const result = parseHotkey('ctrl+a');
    expect(result).toMatchObject({ ctrl: true, alt: false, shift: false, meta: false, mod: false, keys: ['a'] });
  });

  it('parses mod modifier', () => {
    const result = parseHotkey('mod+s');
    expect(result).toMatchObject({ mod: true, ctrl: false, meta: false, keys: ['s'] });
  });

  it('parses shift+alt+key combination', () => {
    const result = parseHotkey('shift+alt+z');
    expect(result).toMatchObject({ shift: true, alt: true, ctrl: false, meta: false, mod: false, keys: ['z'] });
  });

  it('parses meta modifier', () => {
    const result = parseHotkey('meta+k');
    expect(result).toMatchObject({ meta: true, ctrl: false, keys: ['k'] });
  });

  it('handles control as alias for ctrl', () => {
    const result = parseHotkey('control+v');
    expect(result.ctrl).toBe(true);
    expect(result.keys).toContain('v');
  });

  it('maps aliased key in hotkey string', () => {
    const result = parseHotkey('ctrl+esc');
    expect(result.ctrl).toBe(true);
    expect(result.keys).toContain('escape');
  });

  it('supports custom combination key', () => {
    const result = parseHotkey('ctrl-a', '-');
    expect(result.ctrl).toBe(true);
    expect(result.keys).toContain('a');
  });

  it('sets isSequence to false', () => {
    const result = parseHotkey('ctrl+a');
    expect(result.isSequence).toBe(false);
  });

  it('sets useKey to true', () => {
    const result = parseHotkey('ctrl+a');
    expect(result.useKey).toBe(true);
  });

  it('does not include modifiers in keys array', () => {
    const result = parseHotkey('shift+ctrl+alt+meta+x');
    expect(result.keys).toEqual(['x']);
  });
});

// ---------------------------------------------------------------------------
// isBindingPressed
// ---------------------------------------------------------------------------
function makeEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    key: 'a',
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  } as unknown as KeyboardEvent;
}

describe('isBindingPressed', () => {
  it('returns true when ctrl+a binding matches ctrlKey+a event', () => {
    const binding: IKeyBinding = { id: 'test', keys: 'ctrl+a' };
    const event = makeEvent({ ctrlKey: true, key: 'a' });
    expect(isBindingPressed(event as any, binding)).toBe(true);
  });

  it('returns false when required ctrl modifier is missing', () => {
    const binding: IKeyBinding = { id: 'test', keys: 'ctrl+a' };
    const event = makeEvent({ key: 'a' });
    expect(isBindingPressed(event as any, binding)).toBe(false);
  });

  it('returns true when mod binding matches ctrlKey event', () => {
    const binding: IKeyBinding = { id: 'test', keys: 'mod+s' };
    const event = makeEvent({ ctrlKey: true, key: 's' });
    expect(isBindingPressed(event as any, binding)).toBe(true);
  });

  it('returns true when mod binding matches metaKey event', () => {
    const binding: IKeyBinding = { id: 'test', keys: 'mod+s' };
    const event = makeEvent({ metaKey: true, key: 's' });
    expect(isBindingPressed(event as any, binding)).toBe(true);
  });

  it('returns false when shift modifier is missing', () => {
    const binding: IKeyBinding = { id: 'test', keys: 'shift+a' };
    const event = makeEvent({ key: 'a' });
    expect(isBindingPressed(event as any, binding)).toBe(false);
  });

  it('returns true for shift+alt+key when both modifiers present', () => {
    const binding: IKeyBinding = { id: 'test', keys: 'shift+alt+x' };
    const event = makeEvent({ shiftKey: true, altKey: true, key: 'x' });
    expect(isBindingPressed(event as any, binding)).toBe(true);
  });

  it('returns false when key does not match', () => {
    const binding: IKeyBinding = { id: 'test', keys: 'ctrl+a' };
    const event = makeEvent({ ctrlKey: true, key: 'b' });
    expect(isBindingPressed(event as any, binding)).toBe(false);
  });

  it('returns false when binding has no keys', () => {
    const binding: IKeyBinding = { id: 'test' };
    const event = makeEvent({ key: 'a' });
    expect(isBindingPressed(event as any, binding)).toBe(false);
  });

  it('maps event key through mapKey before comparing', () => {
    const binding: IKeyBinding = { id: 'test', keys: 'escape' };
    const event = makeEvent({ key: 'Escape' });
    expect(isBindingPressed(event as any, binding)).toBe(true);
  });

  it('returns false when an extra shift is pressed but binding is mod+/', () => {
    const binding: IKeyBinding = { id: 'test', keys: 'mod+/' };
    const event = makeEvent({ ctrlKey: true, shiftKey: true, key: '/' });
    expect(isBindingPressed(event as any, binding)).toBe(false);
  });

  it('returns false when an extra alt is pressed but binding is ctrl+s', () => {
    const binding: IKeyBinding = { id: 'test', keys: 'ctrl+s' };
    const event = makeEvent({ ctrlKey: true, altKey: true, key: 's' });
    expect(isBindingPressed(event as any, binding)).toBe(false);
  });

  it('returns false when an extra shift and alt are pressed but binding is mod+z', () => {
    const binding: IKeyBinding = { id: 'test', keys: 'mod+z' };
    const event = makeEvent({ ctrlKey: true, shiftKey: true, altKey: true, key: 'z' });
    expect(isBindingPressed(event as any, binding)).toBe(false);
  });

  it('returns false when ctrl is pressed but binding is shift+a (extra ctrl)', () => {
    const binding: IKeyBinding = { id: 'test', keys: 'shift+a' };
    const event = makeEvent({ shiftKey: true, ctrlKey: true, key: 'a' });
    expect(isBindingPressed(event as any, binding)).toBe(false);
  });

  it('returns true when exact modifiers match and no extra modifiers are pressed (mod+/)', () => {
    const binding: IKeyBinding = { id: 'test', keys: 'mod+/' };
    const event = makeEvent({ ctrlKey: true, key: '/' });
    expect(isBindingPressed(event as any, binding)).toBe(true);
  });
});
