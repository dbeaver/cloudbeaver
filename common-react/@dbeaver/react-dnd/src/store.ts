export const DND_STORE_PREFIX = 'application/dbeaver-react-dnd-';

export interface DnDStoreProvider {
  getData: (key: string) => any;
  setData: (key: string, value: any) => void;
  removeData: () => void;
}

class DnDStore {
  private data: Map<string, Record<string, any>> = new Map();
  setData(id: string, key: string, value: any) {
    if (!this.data.has(id)) {
      this.data.set(id, {});
    }
    this.data.get(id)![key] = value;
  }
  getData(id: string, key: string) {
    return this.data.get(id)?.[key];
  }
  removeData(id: string) {
    this.data.delete(id);
  }

  getProvider(id: string) {
    return {
      getData: (key: string) => this.getData(id, key),
      setData: (key: string, value: any) => {
        this.setData(id, key, value);
      },
      removeData: () => {
        this.removeData(id);
      },
    };
  }
}

export function getStoreProvider(event: React.DragEvent<HTMLElement>): DnDStoreProvider | null {
  const id = event.dataTransfer.types.find(type => type.startsWith(DND_STORE_PREFIX))?.slice(DND_STORE_PREFIX.length);

  return id ? globalDnDStore.getProvider(id) : null;
}

// TODO: do we want to use react context here?
//       the main idea was to use native DataTransfer, but it's available only for drag start and drop events
//       so we need to use a custom store
export const globalDnDStore = new DnDStore();
