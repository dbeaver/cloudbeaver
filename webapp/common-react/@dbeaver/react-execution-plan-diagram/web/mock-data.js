// Mock execution plan data - PostgreSQL-style EXPLAIN output
// Usage: open index.html, then in console run: loadMockData()

const MOCK_PLAN = {
  queryString: 'SELECT o.id, o.total, c.name FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.total > 100 ORDER BY o.total DESC LIMIT 50',
  features: {
    hasCost: true,
    hasRows: true,
    hasDuration: true,
  },
  nodes: [
    {
      id: 'node-1',
      kind: 'RESULT',
      name: 'Limit',
      type: 'Limit',
      description: 'Limit rows to 50',
      cost: 245.82,
      percent: 1.0,
      duration: 12.45,
      rowCount: 50,
      properties: [
        { id: 'startup_cost', displayName: 'Startup Cost', value: 245.50, category: 'Costs' },
        { id: 'total_cost', displayName: 'Total Cost', value: 245.82, category: 'Costs' },
        { id: 'plan_rows', displayName: 'Plan Rows', value: 50, category: 'Estimates' },
        { id: 'plan_width', displayName: 'Plan Width', value: 72, category: 'Estimates' },
      ],
    },
    {
      id: 'node-2',
      parentId: 'node-1',
      kind: 'SORT',
      name: 'Sort Key: o.total DESC',
      type: 'Sort',
      description: 'Sort by total descending',
      cost: 245.50,
      percent: 0.85,
      duration: 8.20,
      rowCount: 328,
      properties: [
        { id: 'sort_key', displayName: 'Sort Key', value: 'o.total DESC', category: 'Details' },
        { id: 'sort_method', displayName: 'Sort Method', value: 'quicksort', category: 'Details' },
        { id: 'sort_memory', displayName: 'Sort Space Used', value: '48kB', category: 'Details' },
      ],
    },
    {
      id: 'node-3',
      parentId: 'node-2',
      kind: 'JOIN',
      name: 'Hash Cond: (o.customer_id = c.id)',
      type: 'Hash Join',
      description: 'Hash join on customer_id',
      cost: 230.15,
      percent: 0.72,
      duration: 6.80,
      rowCount: 328,
      properties: [
        { id: 'join_type', displayName: 'Join Type', value: 'Inner', category: 'Details' },
        { id: 'hash_cond', displayName: 'Hash Cond', value: '(o.customer_id = c.id)', category: 'Details' },
      ],
    },
    {
      id: 'node-4',
      parentId: 'node-3',
      kind: 'INDEX_SCAN',
      name: 'orders',
      type: 'Index Scan using idx_orders_total',
      description: 'Scan orders where total > 100',
      condition: 'o.total > 100',
      cost: 185.40,
      percent: 0.55,
      duration: 4.10,
      rowCount: 328,
      properties: [
        { id: 'relation', displayName: 'Relation Name', value: 'orders', category: 'Object' },
        { id: 'index', displayName: 'Index Name', value: 'idx_orders_total', category: 'Object' },
        { id: 'scan_dir', displayName: 'Scan Direction', value: 'Forward', category: 'Details' },
        { id: 'index_cond', displayName: 'Index Cond', value: '(total > 100)', category: 'Filter' },
        { id: 'rows_removed', displayName: 'Rows Removed by Filter', value: 0, category: 'Details' },
      ],
    },
    {
      id: 'node-5',
      parentId: 'node-3',
      kind: 'HASH',
      name: 'customers',
      type: 'Hash',
      description: 'Build hash table for customers',
      cost: 35.50,
      percent: 0.14,
      duration: 2.30,
      rowCount: 1000,
      properties: [
        { id: 'hash_buckets', displayName: 'Hash Buckets', value: 2048, category: 'Details' },
        { id: 'hash_batches', displayName: 'Hash Batches', value: 1, category: 'Details' },
        { id: 'peak_memory', displayName: 'Peak Memory Usage', value: '128kB', category: 'Details' },
      ],
    },
    {
      id: 'node-6',
      parentId: 'node-5',
      kind: 'TABLE_SCAN',
      name: 'customers',
      type: 'Seq Scan',
      description: 'Sequential scan on customers table',
      cost: 22.00,
      percent: 0.09,
      duration: 1.50,
      rowCount: 1000,
      properties: [
        { id: 'relation', displayName: 'Relation Name', value: 'customers', category: 'Object' },
        { id: 'alias', displayName: 'Alias', value: 'c', category: 'Object' },
      ],
    },
  ],
};

// Larger mock with more branching
const MOCK_PLAN_COMPLEX = {
  queryString: `SELECT d.name, COUNT(e.id), AVG(e.salary)
FROM departments d
JOIN employees e ON e.dept_id = d.id
LEFT JOIN projects p ON p.lead_id = e.id
WHERE d.active = true
GROUP BY d.name
HAVING COUNT(e.id) > 5
ORDER BY AVG(e.salary) DESC`,
  features: {
    hasCost: true,
    hasRows: true,
    hasDuration: true,
  },
  nodes: [
    {
      id: 'c-1',
      kind: 'SORT',
      name: 'Sort Key: avg(e.salary) DESC',
      type: 'Sort',
      cost: 892.30,
      percent: 1.0,
      duration: 45.2,
      rowCount: 12,
    },
    {
      id: 'c-2',
      parentId: 'c-1',
      kind: 'FILTER',
      name: 'Filter: count(e.id) > 5',
      type: 'Filter',
      cost: 890.10,
      percent: 0.92,
      duration: 40.1,
      rowCount: 12,
    },
    {
      id: 'c-3',
      parentId: 'c-2',
      kind: 'AGGREGATE',
      name: 'Group Key: d.name',
      type: 'HashAggregate',
      cost: 885.50,
      percent: 0.88,
      duration: 38.5,
      rowCount: 20,
    },
    {
      id: 'c-4',
      parentId: 'c-3',
      kind: 'JOIN',
      name: 'Left Join: p.lead_id = e.id',
      type: 'Hash Left Join',
      cost: 820.00,
      percent: 0.78,
      duration: 32.0,
      rowCount: 5200,
    },
    {
      id: 'c-5',
      parentId: 'c-4',
      kind: 'JOIN',
      name: 'Inner Join: e.dept_id = d.id',
      type: 'Hash Join',
      cost: 450.00,
      percent: 0.45,
      duration: 18.5,
      rowCount: 5000,
    },
    {
      id: 'c-6',
      parentId: 'c-5',
      kind: 'TABLE_SCAN',
      name: 'employees',
      type: 'Seq Scan',
      cost: 250.00,
      percent: 0.28,
      duration: 10.2,
      rowCount: 5000,
    },
    {
      id: 'c-7',
      parentId: 'c-5',
      kind: 'HASH',
      name: 'departments',
      type: 'Hash',
      cost: 25.20,
      percent: 0.03,
      duration: 1.1,
      rowCount: 20,
    },
    {
      id: 'c-8',
      parentId: 'c-7',
      kind: 'INDEX_SCAN',
      name: 'departments',
      type: 'Index Scan using idx_dept_active',
      condition: 'd.active = true',
      cost: 12.50,
      percent: 0.01,
      duration: 0.5,
      rowCount: 20,
    },
    {
      id: 'c-9',
      parentId: 'c-4',
      kind: 'HASH',
      name: 'projects',
      type: 'Hash',
      cost: 120.00,
      percent: 0.13,
      duration: 5.8,
      rowCount: 350,
    },
    {
      id: 'c-10',
      parentId: 'c-9',
      kind: 'TABLE_SCAN',
      name: 'projects',
      type: 'Seq Scan',
      cost: 95.00,
      percent: 0.10,
      duration: 4.2,
      rowCount: 350,
    },
  ],
};

// Helper to load mock data from console
function loadMockData() {
  window.createExecutionPlanDiagram(MOCK_PLAN, {
    highlightHeavyRoute: true,
    enableCollapse: true,
  }, {
    onNodeSelect(nodeId, node) {
      console.log('Selected execution plan node:', nodeId, node);
    },
  });
  console.log('Mock plan loaded. Click a node to see onNodeSelect output in the console. Try: loadComplexMock(), loadWithTranslations(), setPlanData(MOCK_PLAN_COMPLEX)');
}

function loadComplexMock() {
  window.setPlanData(MOCK_PLAN_COMPLEX);
  console.log('Complex mock plan loaded.');
}

function loadWithTranslations() {
  window.createExecutionPlanDiagram(MOCK_PLAN, {
    highlightHeavyRoute: true,
    enableCollapse: true,
  }, {
    onNodeSelect(nodeId, node) {
      console.log('Selected execution plan node:', nodeId, node);
    },
  }, {
    'plugin_sql_execution_plan_diagram_node_expand_hint': '{arg:type} — нажмите C чтобы развернуть',
    'plugin_sql_execution_plan_diagram_node_collapse_hint': '{arg:type} — нажмите C чтобы свернуть',
  });
  console.log('Mock plan with translations loaded. Focus a node with children to see interpolated hints.');
}

console.log('Mock data ready. Run loadMockData() to initialize the diagram.');
