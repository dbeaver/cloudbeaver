/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState, useLayoutEffect, useRef } from 'react';
import type { IFormatRuleState } from '../formatting/IFormatRuleState.js';

const ANIMATION_DURATION = 300;

interface UseRuleTransitionResult {
  isAnimating: boolean;
  previousRule: IFormatRuleState | null;
}

export function useRuleTransition(selectedRule: IFormatRuleState | null): UseRuleTransitionResult {
  const [isAnimating, setIsAnimating] = useState(true);
  const [previousRule, setPreviousRule] = useState<IFormatRuleState | null>(null);
  const prevRuleRef = useRef<IFormatRuleState | null>(selectedRule);

  useLayoutEffect(() => {
    if (prevRuleRef.current !== selectedRule) {
      if (!prevRuleRef.current) {
        prevRuleRef.current = selectedRule;
        return undefined;
      }
      setPreviousRule(prevRuleRef.current);

      setIsAnimating(false);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });

      const timer = setTimeout(() => {
        setPreviousRule(null);
      }, ANIMATION_DURATION);

      prevRuleRef.current = selectedRule;
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [selectedRule]);

  return { isAnimating, previousRule };
}
