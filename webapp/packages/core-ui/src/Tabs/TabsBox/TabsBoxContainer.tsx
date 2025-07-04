/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './TabsBoxContainer.module.css';
import { s, useS } from '@cloudbeaver/core-blocks';

interface FlexibleTabsProps {
  tabs: ReactNode[];
  multipleRows?: boolean;
  className?: string;
}

const TabsBoxContainer: React.FC<FlexibleTabsProps> = ({ tabs, multipleRows, className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [expandIndices, setExpandIndices] = useState<Set<number>>(new Set());
  const style = useS(styles);

  const updateTabExpansion = () => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const children = Array.from(container.children) as HTMLElement[];
    const totalTabsWidth = children.reduce((sum, tab) => sum + (tab.offsetWidth ?? 0), 0);
    const containerWidth = container.offsetWidth;
    const newExpands = new Set<number>();
    const firstChild = children[0];

    if (children.length === 0 || totalTabsWidth <= containerWidth || !firstChild) {
      setExpandIndices(new Set());
      return;
    }

    let currentRowTop = firstChild.offsetTop;

    for (let i = 1; i < children.length; i++) {
      const tab = children[i];
      if (!tab) {
        continue;
      }

      const top = tab.offsetTop;
      const isOnTheNextRow = top !== currentRowTop;

      if (isOnTheNextRow) {
        newExpands.add(i - 1);
        currentRowTop = top;
      }
    }

    setExpandIndices(newExpands);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const resizeObserver = new ResizeObserver(updateTabExpansion);
    resizeObserver.observe(container);

    updateTabExpansion();

    return () => {
      resizeObserver.disconnect();
    };
  }, [tabs]);

  return (
    <div ref={containerRef} className={s(style, { tabContainer: true, multipleRows }, className)}>
      {tabs.map((tabContent, index) => (
        <div key={tabContent?.toString()} className={s(style, { expand: multipleRows &&expandIndices.has(index) })}>
          {tabContent}
        </div>
      ))}
    </div>
  );
};

export default TabsBoxContainer;
