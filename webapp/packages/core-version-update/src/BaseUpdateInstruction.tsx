/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Link, useTranslate } from '@cloudbeaver/core-blocks';

import type { InstructionComponent } from './VersionUpdateService.js';

const SPLITTER = '*splitter*';

export const BaseUpdateInstruction: InstructionComponent = function UpdateInstruction({ version, containerId, link, className }) {
  const translate = useTranslate();
  const mainText = translate('version_update_instruction').split(SPLITTER)[0]?.trim();
  const linkText = translate('version_update_instruction').split(SPLITTER)[1]?.trim();

  return (
    <div className={className}>
      {mainText}{' '}
      <Link href={link} target="_blank" rel="noopener noreferrer" inline indicator>
        {linkText}
      </Link>
    </div>
  );
};
