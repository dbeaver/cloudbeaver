/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="react-sanitized-html.d.ts" />

import Sanitized from 'react-sanitized-html';

export interface SanitizedHTMLProps {
  html: string;
}

const allowedTags = ['h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
  'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
  'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre'];

const nonTextTags = ['title', 'style', 'script', 'textarea', 'noscript'];

export function ReactSanitizedHTML({ html }: SanitizedHTMLProps) {
  return (
    <Sanitized html={html} allowedTags={allowedTags} nonTextTags={nonTextTags} />
  );
}
