export const OUTPUT_LOG_TYPES = ['Debug', 'Log', 'Info', 'Notice', 'Warning', 'Error'] as const;
export type IOutputLogType = (typeof OUTPUT_LOG_TYPES)[number];
