/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { autorun } from 'mobx';
import { describe, expect, it } from 'vitest';

import { DataContext } from './DataContext.js';
import type { DataContextGetter } from './DataContextGetter.js';

const key = { id: 'value', name: 'value' } as DataContextGetter<string | undefined>;
const otherKey = { id: 'other', name: 'other' } as DataContextGetter<string>;

describe('DataContext layers', () => {
  it('resolves values through arbitrarily nested layers', () => {
    const root = new DataContext().set(key, 'root', 'root');
    const child = new DataContext(new DataContext(new DataContext(root)));
    expect(child.get(key)).toBe('root');
    expect(child.has(key)).toBe(true);
    expect(child.hasValue(key, 'root')).toBe(true);
    expect(child.hasOwn(key)).toBe(false);
  });

  it('distinguishes an absent value from an explicit undefined override', () => {
    const context = new DataContext();
    expect(context.hasOwnValue(key, undefined)).toBe(false);
    context.set(key, undefined, 'owner');
    expect(context.hasOwnValue(key, undefined)).toBe(true);
  });

  it('preserves ancestor matching when a child overrides the resolved value', () => {
    const context = new DataContext(new DataContext().set(key, 'parent', 'parent')).set(key, 'child', 'child');
    expect(context.get(key)).toBe('child');
    expect(context.hasValue(key, 'parent')).toBe(true);
    context.deleteForId('child');
    expect(context.get(key)).toBe('parent');
  });

  it('removes omitted keys while preserving other owners and their precedence', () => {
    const context = new DataContext().set(key, 'first', 'first').set(key, 'second', 'second');
    context.replaceForId('first', [[otherKey, 'new']]);
    expect(context.get(key)).toBe('second');
    expect(context.get(otherKey)).toBe('new');
    context.replaceForId('second', []);
    expect(context.has(key)).toBe(false);
  });

  it('publishes a replacement atomically to observers', () => {
    const context = new DataContext().set(key, 'old', 'owner');
    const observed: unknown[] = [];
    const dispose = autorun(() => observed.push([context.get(key), context.get(otherKey)]));
    context.replaceForId('owner', [[otherKey, 'new']]);
    dispose();
    expect(observed).toEqual([
      ['old', undefined],
      [undefined, 'new'],
    ]);
  });

  it('does not notify observers when the same contribution is supplied again', () => {
    const context = new DataContext().set(key, 'same', 'owner');
    let calls = 0;
    const dispose = autorun(() => {
      context.get(key);
      calls++;
    });
    context.replaceForId('owner', [[key, 'same']]);
    dispose();
    expect(calls).toBe(1);
  });

  it('tracks a changed parent and restores fallback values after disposal', () => {
    const context = new DataContext(new DataContext().set(key, 'old', 'parent'));
    const observed: unknown[] = [];
    const dispose = autorun(() => observed.push(context.get(key)));
    context.setFallBack(new DataContext().set(key, 'new', 'parent'));
    context.set(key, 'own', 'owner');
    context.deleteForId('owner');
    dispose();
    expect(observed).toEqual(['old', 'new', 'own', 'new']);
  });
});
