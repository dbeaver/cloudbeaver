/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ThemeSelector } from '@cloudbeaver/core-theming';
import './base-code-editor.css';
import './base-code-editor-autocompletion.css';
import './base-code-editor-tooltip.css';

export const EDITOR_BASE_STYLES: ThemeSelector = async theme => {
  let styles: any;

  switch (theme) {
    case 'dark':
      styles = (await import('./dark.css')).default;
      break;
    default:
      styles = (await import('./light.css')).default;
      break;
  }

  return styles;
};
