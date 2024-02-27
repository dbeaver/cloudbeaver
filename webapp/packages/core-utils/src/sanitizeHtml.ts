/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import DOMPurify from 'dompurify';

export function sanitizeHtml<T extends string | HTMLElement>(dirty: T): T extends string ? string : HTMLElement {
  const purify = DOMPurify(window);

  return purify.sanitize(dirty, {}) as T extends string ? string : HTMLElement;
}
