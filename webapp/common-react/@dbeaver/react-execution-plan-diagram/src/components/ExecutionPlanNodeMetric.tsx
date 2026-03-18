/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ReactElement, ReactNode } from 'react';
import { useTranslate } from '@dbeaver/react-translate';

import './ExecutionPlanNodeMetric.css';

interface ExecutionPlanNodeMetricProps {
  labelKey: string;
  label: string;
  children: ReactNode;
}

export function ExecutionPlanNodeMetric({ labelKey, label, children }: ExecutionPlanNodeMetricProps): ReactElement {
  const translate = useTranslate();

  return (
    <div className="dbv-plan-node-metric">
      <span className="dbv-plan-node-metric__label">{translate(labelKey, label)}</span>
      <span className="dbv-plan-node-metric__value">{children}</span>
    </div>
  );
}
