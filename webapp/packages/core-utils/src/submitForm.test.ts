/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, it, vitest } from 'vitest';
import { objectToFormFields, submitForm } from './submitForm.js';

describe('submitForm', () => {
  let submitSpy: ReturnType<typeof vitest.spyOn<HTMLFormElement, 'submit'>>;
  let capturedForm: HTMLFormElement | null;

  // submit() is the moment when the form is fully populated and still attached to the DOM —
  // submitForm removes it right after. We snapshot it from document.body here.
  const getForm = (): HTMLFormElement => {
    if (!capturedForm) {
      throw new Error('submit() was not called');
    }
    return capturedForm;
  };
  const getInputs = (): HTMLInputElement[] => Array.from(getForm().querySelectorAll('input'));

  beforeEach(() => {
    document.body.innerHTML = '';
    capturedForm = null;
    submitSpy = vitest.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {
      capturedForm = document.body.querySelector('form');
    });
  });

  afterEach(() => {
    submitSpy.mockRestore();
  });

  it('should create a form with POST method and target _blank', () => {
    submitForm('/api/test', []);

    const form = getForm();
    expect(form.tagName).toBe('FORM');
    expect(form.method.toLowerCase()).toBe('post');
    expect(form.action).toContain('/api/test');
    expect(form.target).toBe('_blank');
    expect(form.style.display).toBe('none');
  });

  it('should attach the form to document.body before submit', () => {
    submitForm('/api/test', []);

    // capturedForm is read inside submit(), so being non-null proves the form was in the DOM at that point
    expect(capturedForm).not.toBeNull();
  });

  it('should append hidden inputs for each field', () => {
    submitForm('/api/test', [
      ['name', 'John'],
      ['age', '30'],
    ]);

    const inputs = getInputs();
    expect(inputs).toHaveLength(2);
    expect(inputs[0]!.type).toBe('hidden');
    expect(inputs[0]!.name).toBe('name');
    expect(inputs[0]!.value).toBe('John');
    expect(inputs[1]!.type).toBe('hidden');
    expect(inputs[1]!.name).toBe('age');
    expect(inputs[1]!.value).toBe('30');
  });

  it('should submit the form and remove it from the DOM', () => {
    submitForm('/api/test', [['key', 'value']]);

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(document.body.querySelector('form')).toBeNull();
  });

  it('should support repeated keys (e.g. for array fields)', () => {
    submitForm('/api/test', [
      ['ids', '1'],
      ['ids', '2'],
      ['ids', '3'],
    ]);

    const ids = getInputs().filter(i => i.name === 'ids');
    expect(ids).toHaveLength(3);
    expect(ids.map(i => i.value)).toEqual(['1', '2', '3']);
  });

  it('should accept any iterable of key/value pairs', () => {
    const fields = new Map([
      ['a', '1'],
      ['b', '2'],
    ]);

    submitForm('/api/test', fields);

    const inputs = getInputs();
    expect(inputs).toHaveLength(2);
    expect(inputs.map(i => [i.name, i.value])).toEqual([
      ['a', '1'],
      ['b', '2'],
    ]);
  });

  it('should also accept a generator', () => {
    function* gen(): Generator<readonly [string, string]> {
      yield ['x', '1'];
      yield ['y', '2'];
    }

    submitForm('/api/test', gen());

    expect(getInputs().map(i => [i.name, i.value])).toEqual([
      ['x', '1'],
      ['y', '2'],
    ]);
  });

  it('should handle an empty fields iterable', () => {
    submitForm('/api/test', []);

    expect(getInputs()).toHaveLength(0);
    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(document.body.querySelector('form')).toBeNull();
  });
});

describe('objectToFormFields', () => {
  it('should convert primitive values to string fields', () => {
    expect(
      objectToFormFields({
        name: 'John',
        age: 30,
        active: true,
      }),
    ).toEqual([
      ['name', 'John'],
      ['age', '30'],
      ['active', 'true'],
    ]);
  });

  it('should skip null, undefined, and empty string values', () => {
    expect(
      objectToFormFields({
        a: 'value',
        b: null,
        c: undefined,
        d: '',
        e: 'other',
      }),
    ).toEqual([
      ['a', 'value'],
      ['e', 'other'],
    ]);
  });

  it('should keep falsy non-empty values (0, false)', () => {
    expect(
      objectToFormFields({
        zero: 0,
        falseFlag: false,
      }),
    ).toEqual([
      ['zero', '0'],
      ['falseFlag', 'false'],
    ]);
  });

  it('should expand arrays into repeated fields', () => {
    expect(
      objectToFormFields({
        tags: ['a', 'b', 'c'],
      }),
    ).toEqual([
      ['tags', 'a'],
      ['tags', 'b'],
      ['tags', 'c'],
    ]);
  });

  it('should skip null/undefined/empty entries inside arrays', () => {
    expect(
      objectToFormFields({
        ids: [1, null, 2, undefined, '', 3],
      }),
    ).toEqual([
      ['ids', '1'],
      ['ids', '2'],
      ['ids', '3'],
    ]);
  });

  it('should flatten nested objects, hoisting inner keys to top level', () => {
    expect(
      objectToFormFields({
        user: {
          name: 'John',
          age: 30,
        },
      }),
    ).toEqual([
      ['name', 'John'],
      ['age', '30'],
    ]);
  });

  it('should flatten deeply nested objects', () => {
    expect(
      objectToFormFields({
        outer: {
          middle: {
            leaf: 'value',
          },
        },
      }),
    ).toEqual([['leaf', 'value']]);
  });

  it('should handle nested objects mixed with arrays', () => {
    expect(
      objectToFormFields({
        meta: {
          tags: ['x', 'y'],
          name: 'foo',
        },
        id: 1,
      }),
    ).toEqual([
      ['tags', 'x'],
      ['tags', 'y'],
      ['name', 'foo'],
      ['id', '1'],
    ]);
  });

  it('should return an empty array for an empty object', () => {
    expect(objectToFormFields({})).toEqual([]);
  });

  it('should return an empty array when all values are skipped', () => {
    expect(
      objectToFormFields({
        a: null,
        b: undefined,
        c: '',
        d: [],
        e: [null, '', undefined],
      }),
    ).toEqual([]);
  });
});
