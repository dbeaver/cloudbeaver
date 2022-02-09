/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { TLocalizationToken } from './TLocalizationToken';
import { useTranslate } from './useTranslate';

interface Props {
  token: TLocalizationToken;
  fallback?: TLocalizationToken;
  [key: string]: any;
}

export const Translate = observer<Props>(function Translate({ token, fallback, children, ...args }) {
  const translate = useTranslate();

  return <>{translate(token, fallback, args)}</>;
});
