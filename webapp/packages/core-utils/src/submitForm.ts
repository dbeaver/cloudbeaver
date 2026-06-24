/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function submitForm(url: string, fields: Iterable<readonly [string, string]>): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  form.target = '_blank';
  form.style.display = 'none';

  for (const [name, value] of fields) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

/**
 * Flattens an object into form-encoded key/value pairs, skipping falsy values:
 * - arrays become repeated fields (`key=v1&key=v2`)
 * - nested objects are flattened — their inner keys become top-level fields (!collision of inner keys is not handled)
 */
export function objectToFormFields(obj: Record<string, unknown>): Array<[string, string]> {
  const fields: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(obj)) {
    appendField(fields, key, value);
  }
  return fields;
}

function appendField(fields: Array<[string, string]>, key: string, value: unknown): void {
  if (value == null || value === '') {
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item != null && item !== '') {
        fields.push([key, String(item)]);
      }
    }
    return;
  }
  if (typeof value === 'object') {
    for (const [innerKey, innerValue] of Object.entries(value)) {
      appendField(fields, innerKey, innerValue);
    }
    return;
  }
  fields.push([key, String(value)]);
}
