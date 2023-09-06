import { createContext, useState } from 'react';

export const RenderContext = createContext({
  onRenderCallback,
  tabId: 0,
  setTabId: (id: number) => {},
});

export const RenderProvider = ({ children }: { children: any }) => {
  const [tabId, setTabId] = useState(0);

  return <RenderContext.Provider value={{ onRenderCallback, tabId, setTabId }}>{children}</RenderContext.Provider>;
};

export function onRenderCallback(
  id: any,
  phase: any,
  actualDuration: any,
  baseDuration: any,
  startTime: any,
  endTime: any,
  interactions: any,
  details: any,
) {
  console.log({
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    endTime,
    interactions,
    details,
  });
}
