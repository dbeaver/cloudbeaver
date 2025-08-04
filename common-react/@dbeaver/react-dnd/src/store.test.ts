import { describe, it, expect } from 'vitest';
import React from 'react';
import { DND_STORE_PREFIX, DnDStore, getStoreProvider } from './store.js';

function createMockDragEvent(id?: string): React.DragEvent<HTMLElement> {
  const types = id ? [DND_STORE_PREFIX + id] : [];
  return {
    dataTransfer: { types },
  } as unknown as React.DragEvent<HTMLElement>;
}

describe('DnDStore', () => {
  it('sets and gets data correctly', () => {
    const store = new DnDStore();
    store.setData('id1', 'key1', 'value1');
    expect(store.getData('id1', 'key1')).toBe('value1');
  });

  it('removes data correctly', () => {
    const store = new DnDStore();

    store.setData('id2', 'key2', 'value2');
    store.removeData('id2');
    expect(store.getData('id2', 'key2')).toBeUndefined();
  });

  it('getProvider returns a working provider', () => {
    const store = new DnDStore();

    const provider = store.getProvider('id3');
    provider.setData('key3', 'value3');
    expect(provider.getData('key3')).toBe('value3');
    provider.removeData();
    expect(provider.getData('key3')).toBeUndefined();
  });
});

describe('getStoreProvider', () => {
  it('returns null if no DND_STORE_PREFIX type is present', () => {
    const event = createMockDragEvent();
    expect(getStoreProvider(event)).toBeNull();
  });

  it('returns a provider if DND_STORE_PREFIX type is present', () => {
    const id = 'testid';
    const event = createMockDragEvent(id);
    const provider = getStoreProvider(event);
    expect(provider).not.toBeNull();
    provider!.setData('foo', 'bar');
    expect(provider!.getData('foo')).toBe('bar');
    provider!.removeData();
    expect(provider!.getData('foo')).toBeUndefined();
  });
});
