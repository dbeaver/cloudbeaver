import { useState } from 'react';
import {
  ComboboxProvider,
  ComboboxSearchContextProvider,
  ComboboxInput,
  ComboboxPopover,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxRoot,
} from '../../../Combobox/Combobox.js';

function Simple() {
  const [value, setValue] = useState('');
  return (
    <ComboboxRoot comboboxProps={{ setSelectedValue: item => setValue(item as string) }}>
      <div>{value}</div>
      <ComboboxInput valueFormatter={value => value.toUpperCase()} placeholder="Search fruits..." />
      <ComboboxPopover>
        <ComboboxItem value="apple">Apple</ComboboxItem>
        <ComboboxItem value="banana">Banana</ComboboxItem>
        <ComboboxItem value="cherry">Cherry</ComboboxItem>
        <ComboboxEmpty>No fruits found</ComboboxEmpty>
      </ComboboxPopover>
    </ComboboxRoot>
  );
}

function FlexibleLayout() {
  return (
    <ComboboxRoot>
      <div className="search-container">
        {/* Input in header */}
        <header className="search-header">
          <h2>Food Search</h2>
          <ComboboxInput placeholder="Type to search..." />
        </header>

        {/* Results in main content area */}
        <main className="search-results">
          <ComboboxPopover className="results-popover">
            <div className="category">
              <h3>🍎 Fruits</h3>
              <ComboboxItem value="apple">Apple</ComboboxItem>
              <ComboboxItem value="banana">Banana</ComboboxItem>
              <ComboboxItem value="orange">Orange</ComboboxItem>
            </div>

            <div className="category">
              <h3>🥕 Vegetables</h3>
              <ComboboxItem value="carrot">Carrot</ComboboxItem>
              <ComboboxItem value="broccoli">Broccoli</ComboboxItem>
              <ComboboxItem value="spinach">Spinach</ComboboxItem>
            </div>

            <ComboboxEmpty>
              <div className="empty-state">
                <p>No food items match your search</p>
                <button>Suggest new item</button>
              </div>
            </ComboboxEmpty>
          </ComboboxPopover>
        </main>

        {/* Quick access sidebar */}
        <aside className="quick-access">
          <h3>Quick Access</h3>
          <div className="quick-items">
            <ComboboxItem value="apple" className="quick-item">
              🍎
            </ComboboxItem>
            <ComboboxItem value="banana" className="quick-item">
              🍌
            </ComboboxItem>
            <ComboboxItem value="carrot" className="quick-item">
              🥕
            </ComboboxItem>
          </div>
        </aside>
      </div>
    </ComboboxRoot>
  );
}

function MultiInput() {
  return (
    <ComboboxRoot>
      <div className="multi-search">
        {/* Primary search */}
        <div className="primary-search">
          <label>Main Search:</label>
          <ComboboxInput placeholder="Search all items..." />
        </div>

        {/* Quick search */}
        <div className="quick-search">
          <label>Quick Search:</label>
          <ComboboxInput placeholder="Quick find..." />
        </div>

        {/* Shared results */}
        <ComboboxPopover>
          <ComboboxItem value="react">React</ComboboxItem>
          <ComboboxItem value="vue">Vue</ComboboxItem>
          <ComboboxItem value="angular">Angular</ComboboxItem>
          <ComboboxItem value="svelte">Svelte</ComboboxItem>
          <ComboboxEmpty>No frameworks found</ComboboxEmpty>
        </ComboboxPopover>
      </div>
    </ComboboxRoot>
  );
}

function DynamicItems() {
  const [items, setItems] = useState([
    { id: 1, name: 'Task 1', category: 'work' },
    { id: 2, name: 'Task 2', category: 'personal' },
    { id: 3, name: 'Task 3', category: 'work' },
  ]);

  const [newItemName, setNewItemName] = useState('');

  const addItem = () => {
    if (newItemName.trim()) {
      setItems(prev => [
        ...prev,
        {
          id: Date.now(),
          name: newItemName,
          category: 'work',
        },
      ]);
      setNewItemName('');
    }
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <ComboboxProvider>
      <ComboboxSearchContextProvider>
        <div className="dynamic-example">
          <div className="controls">
            <ComboboxInput placeholder="Search tasks..." />

            <div className="add-item">
              <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="New task name..." />
              <button onClick={addItem}>Add Task</button>
            </div>
          </div>

          <ComboboxPopover>
            <div className="task-categories">
              <div className="category">
                <h4>Work Tasks</h4>
                {items
                  .filter(item => item.category === 'work')
                  .map(item => (
                    <ComboboxItem key={item.id} value={item.name}>
                      <div className="task-item">
                        <span>{item.name}</span>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            removeItem(item.id);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </ComboboxItem>
                  ))}
              </div>

              <div className="category">
                <h4>Personal Tasks</h4>
                {items
                  .filter(item => item.category === 'personal')
                  .map(item => (
                    <ComboboxItem key={item.id} value={item.name}>
                      <div className="task-item">
                        <span>{item.name}</span>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            removeItem(item.id);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </ComboboxItem>
                  ))}
              </div>
            </div>

            <ComboboxEmpty>
              <div className="empty-tasks">
                <p>No tasks match your search</p>
                <p>Try a different search term or add a new task</p>
              </div>
            </ComboboxEmpty>
          </ComboboxPopover>
        </div>
      </ComboboxSearchContextProvider>
    </ComboboxProvider>
  );
}

function AdvancedSearch() {
  const products = [
    { id: 1, value: 'macbook_pro', name: 'MacBook Pro', category: 'laptop', price: 2000 },
    { id: 2, value: 'iphone_15', name: 'iPhone 15', category: 'phone', price: 1000 },
    { id: 3, value: 'ipad_air', name: 'iPad Air', category: 'tablet', price: 600 },
    { id: 4, value: 'airpods_pro', name: 'AirPods Pro', category: 'audio', price: 250 },
  ];

  return (
    <ComboboxProvider>
      <ComboboxSearchContextProvider
        searchOptions={{
          searchFields: ['name', 'category'],
        }}
      >
        <div className="product-search">
          <div className="search-header">
            <ComboboxInput
              valueFormatter={value => products.find(item => item.value === value)?.name || value}
              placeholder="Search products by name or category..."
            />
            <div className="search-tips">Try: "macbook", "laptop", "phone", "audio", etc.</div>
          </div>

          <ComboboxPopover className="product-results">
            {products.map(product => (
              <ComboboxItem key={product.id} value={product.value} searchData={{ name: product.name, category: product.category }}>
                <div className="product-card">
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <span className="category">{product.category}</span>
                  </div>
                  <div className="product-price">${product.price}</div>
                </div>
              </ComboboxItem>
            ))}

            <ComboboxEmpty>
              <div className="no-products">
                <h4>No products found</h4>
                <p>Try searching for: Product names (MacBook, iPhone, etc.) or categories (laptop, phone, etc.)</p>
              </div>
            </ComboboxEmpty>
          </ComboboxPopover>
        </div>
      </ComboboxSearchContextProvider>
    </ComboboxProvider>
  );
}
function MultiSelectExample() {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const items = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'orange', label: 'Orange' },
    { value: 'grape', label: 'Grape' },
  ];

  return (
    <ComboboxProvider selectedValue={selectedValues} setSelectedValue={setSelectedValues}>
      <ComboboxSearchContextProvider>
        <div className="multi-select-example">
          <div>
            <strong>Selected:</strong> {selectedValues.join(', ') || 'None'}
          </div>
          <ComboboxInput placeholder="Select fruits..." />
          <ComboboxPopover>
            {items.map(item => (
              <ComboboxItem key={item.value} value={item.value}>
                <input type="checkbox" checked={selectedValues.includes(item.value)} readOnly style={{ marginRight: 8 }} />
                {item.label}
              </ComboboxItem>
            ))}
            <ComboboxEmpty>No fruits found</ComboboxEmpty>
          </ComboboxPopover>
        </div>
      </ComboboxSearchContextProvider>
    </ComboboxProvider>
  );
}
export { Simple, FlexibleLayout, MultiInput, DynamicItems, AdvancedSearch, MultiSelectExample };
