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
  direction: 'left' | 'right';
}

interface PrevRuleRef {
  rule: IFormatRuleState;
  index: number;
}

export function useRuleTransition(rules: IFormatRuleState[], selectedRule: IFormatRuleState | null): UseRuleTransitionResult {
  const [isAnimating, setIsAnimating] = useState(true);
  const [previousRule, setPreviousRule] = useState<IFormatRuleState | null>(null);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const selectedRuleIndex = rules.findIndex(r => r.id === selectedRule?.id);
  const prevRuleRef = useRef<PrevRuleRef | null>(selectedRule ? { rule: selectedRule, index: selectedRuleIndex } : null);

  useLayoutEffect(() => {
    if (prevRuleRef.current?.rule.id !== selectedRule?.id) {
      if (!prevRuleRef.current) {
        prevRuleRef.current = { rule: selectedRule!, index: selectedRuleIndex };
        return undefined;
      }
      setPreviousRule(prevRuleRef.current.rule);

      setDirection(selectedRuleIndex >= prevRuleRef.current.index ? 'left' : 'right');

      setIsAnimating(false);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });

      const timer = setTimeout(() => {
        setPreviousRule(null);
      }, ANIMATION_DURATION);

      prevRuleRef.current = selectedRule ? { rule: selectedRule, index: selectedRuleIndex } : null;
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [selectedRule]);

  return { isAnimating, previousRule, direction };
}
