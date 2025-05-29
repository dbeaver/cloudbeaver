export type TableSourceEvents = {
  loading: (state: boolean) => void;
  outdated: (state: boolean) => void;
  saved: () => void;
  data: () => void;
  error: (error: Error | null) => void;
};
