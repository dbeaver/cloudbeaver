import { createContext, useContext, useMemo, useEffect, useLayoutEffect as useLayoutEffect$1, useRef, useState, useCallback, memo, forwardRef, useId, useImperativeHandle } from 'react';
import { flushSync } from 'react-dom';
import clsx from 'clsx';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

function getColSpan(column, lastFrozenColumnIndex, args) {
  const colSpan = typeof column.colSpan === 'function' ? column.colSpan(args) : 1;
  if (Number.isInteger(colSpan) && colSpan > 1 && (!column.frozen || column.idx + colSpan - 1 <= lastFrozenColumnIndex)) {
    return colSpan;
  }
  return undefined;
}

function stopPropagation(event) {
  event.stopPropagation();
}
function scrollIntoView(element) {
  element?.scrollIntoView({
    inline: 'nearest',
    block: 'nearest'
  });
}

function createCellEvent(event) {
  let defaultPrevented = false;
  const cellEvent = {
    ...event,
    preventGridDefault() {
      defaultPrevented = true;
    },
    isGridDefaultPrevented() {
      return defaultPrevented;
    }
  };
  Object.setPrototypeOf(cellEvent, Object.getPrototypeOf(event));
  return cellEvent;
}

const nonInputKeys = new Set(['Unidentified', 'Alt', 'AltGraph', 'CapsLock', 'Control', 'Fn', 'FnLock', 'Meta', 'NumLock', 'ScrollLock', 'Shift', 'Tab', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', 'Insert', 'ContextMenu', 'Escape', 'Pause', 'Play', 'PrintScreen', 'F1', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12']);
function isCtrlKeyHeldDown(e) {
  return (e.ctrlKey || e.metaKey) && e.key !== 'Control';
}
function isDefaultCellInput(event) {
  const vKey = 86;
  if (isCtrlKeyHeldDown(event) && event.keyCode !== vKey) return false;
  return !nonInputKeys.has(event.key);
}
function onEditorNavigation({
  key,
  target
}) {
  if (key === 'Tab' && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
    return target.closest('.rdg-editor-container')?.querySelectorAll('input, textarea, select').length === 1;
  }
  return false;
}

const measuringCellClassname = "mlln6zg7-0-0-beta-42";
function renderMeasuringCells(viewportColumns) {
  return viewportColumns.map(({
    key,
    idx,
    minWidth,
    maxWidth
  }) => /*#__PURE__*/jsx("div", {
    className: measuringCellClassname,
    style: {
      gridColumnStart: idx + 1,
      minWidth,
      maxWidth
    },
    "data-measuring-cell-key": key
  }, key));
}

function isSelectedCellEditable({
  selectedPosition,
  columns,
  rows
}) {
  const column = columns[selectedPosition.idx];
  const row = rows[selectedPosition.rowIdx];
  return isCellEditableUtil(column, row);
}
function isCellEditableUtil(column, row) {
  return column.renderEditCell != null && (typeof column.editable === 'function' ? column.editable(row) : column.editable) !== false;
}
function getSelectedCellColSpan({
  rows,
  topSummaryRows,
  bottomSummaryRows,
  rowIdx,
  mainHeaderRowIdx,
  lastFrozenColumnIndex,
  column
}) {
  const topSummaryRowsCount = topSummaryRows?.length ?? 0;
  if (rowIdx === mainHeaderRowIdx) {
    return getColSpan(column, lastFrozenColumnIndex, {
      type: 'HEADER'
    });
  }
  if (topSummaryRows && rowIdx > mainHeaderRowIdx && rowIdx <= topSummaryRowsCount + mainHeaderRowIdx) {
    return getColSpan(column, lastFrozenColumnIndex, {
      type: 'SUMMARY',
      row: topSummaryRows[rowIdx + topSummaryRowsCount]
    });
  }
  if (rowIdx >= 0 && rowIdx < rows.length) {
    const row = rows[rowIdx];
    return getColSpan(column, lastFrozenColumnIndex, {
      type: 'ROW',
      row
    });
  }
  if (bottomSummaryRows) {
    return getColSpan(column, lastFrozenColumnIndex, {
      type: 'SUMMARY',
      row: bottomSummaryRows[rowIdx - rows.length]
    });
  }
  return undefined;
}
function getNextSelectedCellPosition({
  moveUp,
  moveNext,
  cellNavigationMode,
  columns,
  colSpanColumns,
  rows,
  topSummaryRows,
  bottomSummaryRows,
  minRowIdx,
  mainHeaderRowIdx,
  maxRowIdx,
  currentPosition: {
    idx: currentIdx,
    rowIdx: currentRowIdx
  },
  nextPosition,
  lastFrozenColumnIndex,
  isCellWithinBounds
}) {
  let {
    idx: nextIdx,
    rowIdx: nextRowIdx
  } = nextPosition;
  const columnsCount = columns.length;
  const setColSpan = moveNext => {
    for (const column of colSpanColumns) {
      const colIdx = column.idx;
      if (colIdx > nextIdx) break;
      const colSpan = getSelectedCellColSpan({
        rows,
        topSummaryRows,
        bottomSummaryRows,
        rowIdx: nextRowIdx,
        mainHeaderRowIdx,
        lastFrozenColumnIndex,
        column
      });
      if (colSpan && nextIdx > colIdx && nextIdx < colSpan + colIdx) {
        nextIdx = colIdx + (moveNext ? colSpan : 0);
        break;
      }
    }
  };
  const getParentRowIdx = parent => {
    return parent.level + mainHeaderRowIdx;
  };
  const setHeaderGroupColAndRowSpan = () => {
    if (moveNext) {
      const nextColumn = columns[nextIdx];
      let parent = nextColumn.parent;
      while (parent !== undefined) {
        const parentRowIdx = getParentRowIdx(parent);
        if (nextRowIdx === parentRowIdx) {
          nextIdx = parent.idx + parent.colSpan;
          break;
        }
        parent = parent.parent;
      }
    } else if (moveUp) {
      const nextColumn = columns[nextIdx];
      let parent = nextColumn.parent;
      let found = false;
      while (parent !== undefined) {
        const parentRowIdx = getParentRowIdx(parent);
        if (nextRowIdx >= parentRowIdx) {
          nextIdx = parent.idx;
          nextRowIdx = parentRowIdx;
          found = true;
          break;
        }
        parent = parent.parent;
      }
      if (!found) {
        nextIdx = currentIdx;
        nextRowIdx = currentRowIdx;
      }
    }
  };
  if (isCellWithinBounds(nextPosition)) {
    setColSpan(moveNext);
    if (nextRowIdx < mainHeaderRowIdx) {
      setHeaderGroupColAndRowSpan();
    }
  }
  if (cellNavigationMode === 'CHANGE_ROW') {
    const isAfterLastColumn = nextIdx === columnsCount;
    const isBeforeFirstColumn = nextIdx === -1;
    if (isAfterLastColumn) {
      const isLastRow = nextRowIdx === maxRowIdx;
      if (!isLastRow) {
        nextIdx = 0;
        nextRowIdx += 1;
      }
    } else if (isBeforeFirstColumn) {
      const isFirstRow = nextRowIdx === minRowIdx;
      if (!isFirstRow) {
        nextRowIdx -= 1;
        nextIdx = columnsCount - 1;
      }
      setColSpan(false);
    }
  }
  if (nextRowIdx < mainHeaderRowIdx) {
    const nextColumn = columns[nextIdx];
    let parent = nextColumn.parent;
    const nextParentRowIdx = nextRowIdx;
    nextRowIdx = mainHeaderRowIdx;
    while (parent !== undefined) {
      const parentRowIdx = getParentRowIdx(parent);
      if (parentRowIdx >= nextParentRowIdx) {
        nextRowIdx = parentRowIdx;
        nextIdx = parent.idx;
      }
      parent = parent.parent;
    }
  }
  return {
    idx: nextIdx,
    rowIdx: nextRowIdx
  };
}
function canExitGrid({
  maxColIdx,
  minRowIdx,
  maxRowIdx,
  selectedPosition: {
    rowIdx,
    idx
  },
  shiftKey
}) {
  const atLastCellInRow = idx === maxColIdx;
  const atFirstCellInRow = idx === 0;
  const atLastRow = rowIdx === maxRowIdx;
  const atFirstRow = rowIdx === minRowIdx;
  return shiftKey ? atFirstCellInRow && atFirstRow : atLastCellInRow && atLastRow;
}

const cell = "cj343x07-0-0-beta-42";
const cellClassname = `rdg-cell ${cell}`;
const cellFrozen = "csofj7r7-0-0-beta-42";
const cellFrozenClassname = `rdg-cell-frozen ${cellFrozen}`;

function getRowStyle(rowIdx, height) {
  if (height !== undefined) {
    return {
      '--rdg-grid-row-start': rowIdx,
      '--rdg-row-height': `${height}px`
    };
  }
  return {
    '--rdg-grid-row-start': rowIdx
  };
}
function getHeaderCellStyle(column, rowIdx, rowSpan) {
  const gridRowEnd = rowIdx + 1;
  const paddingBlockStart = `calc(${rowSpan - 1} * var(--rdg-header-row-height))`;
  if (column.parent === undefined) {
    return {
      insetBlockStart: 0,
      gridRowStart: 1,
      gridRowEnd,
      paddingBlockStart
    };
  }
  return {
    insetBlockStart: `calc(${rowIdx - rowSpan} * var(--rdg-header-row-height))`,
    gridRowStart: gridRowEnd - rowSpan,
    gridRowEnd,
    paddingBlockStart
  };
}
function getCellStyle(column, colSpan = 1) {
  const index = column.idx + 1;
  return {
    gridColumnStart: index,
    gridColumnEnd: index + colSpan,
    insetInlineStart: column.frozen ? `var(--rdg-frozen-left-${column.idx})` : undefined
  };
}
function getCellClassname(column, ...extraClasses) {
  return clsx(cellClassname, ...extraClasses, column.frozen && cellFrozenClassname);
}

const {
  min,
  max,
  floor,
  sign,
  abs
} = Math;
function assertIsValidKeyGetter(keyGetter) {
  if (typeof keyGetter !== 'function') {
    throw new Error('Please specify the rowKeyGetter prop to use selection');
  }
}
function clampColumnWidth(width, {
  minWidth,
  maxWidth
}) {
  width = max(width, minWidth);
  if (typeof maxWidth === 'number' && maxWidth >= minWidth) {
    return min(width, maxWidth);
  }
  return width;
}
function getHeaderCellRowSpan(column, rowIdx) {
  return column.parent === undefined ? rowIdx : column.level - column.parent.level;
}

const checkboxLabel = "c1bn88vv7-0-0-beta-42";
const checkboxLabelClassname = `rdg-checkbox-label ${checkboxLabel}`;
const checkboxInput = "c1qt073l7-0-0-beta-42";
const checkboxInputClassname = `rdg-checkbox-input ${checkboxInput}`;
const checkbox = "cf71kmq7-0-0-beta-42";
const checkboxClassname = `rdg-checkbox ${checkbox}`;
const checkboxLabelDisabled = "c1lwve4p7-0-0-beta-42";
const checkboxLabelDisabledClassname = `rdg-checkbox-label-disabled ${checkboxLabelDisabled}`;
function renderCheckbox({
  onChange,
  ...props
}) {
  function handleChange(e) {
    onChange(e.target.checked, e.nativeEvent.shiftKey);
  }
  return /*#__PURE__*/jsxs("label", {
    className: clsx(checkboxLabelClassname, props.disabled && checkboxLabelDisabledClassname),
    children: [/*#__PURE__*/jsx("input", {
      type: "checkbox",
      ...props,
      className: checkboxInputClassname,
      onChange: handleChange
    }), /*#__PURE__*/jsx("div", {
      className: checkboxClassname
    })]
  });
}

const groupCellContent = "g1s9ylgp7-0-0-beta-42";
const groupCellContentClassname = `rdg-group-cell-content ${groupCellContent}`;
const caret = "cz54e4y7-0-0-beta-42";
const caretClassname = `rdg-caret ${caret}`;
function renderToggleGroup(props) {
  return /*#__PURE__*/jsx(ToggleGroup, {
    ...props
  });
}
function ToggleGroup({
  groupKey,
  isExpanded,
  tabIndex,
  toggleGroup
}) {
  function handleKeyDown({
    key
  }) {
    if (key === 'Enter') {
      toggleGroup();
    }
  }
  const d = isExpanded ? 'M1 1 L 7 7 L 13 1' : 'M1 7 L 7 1 L 13 7';
  return /*#__PURE__*/jsxs("span", {
    className: groupCellContentClassname,
    tabIndex: tabIndex,
    onKeyDown: handleKeyDown,
    children: [groupKey, /*#__PURE__*/jsx("svg", {
      viewBox: "0 0 14 8",
      width: "14",
      height: "8",
      className: caretClassname,
      "aria-hidden": true,
      children: /*#__PURE__*/jsx("path", {
        d: d
      })
    })]
  });
}

function renderValue(props) {
  try {
    return props.row[props.column.key];
  } catch {
    return null;
  }
}

const DataGridDefaultRenderersContext = /*#__PURE__*/createContext(undefined);
const DataGridDefaultRenderersProvider = DataGridDefaultRenderersContext.Provider;
function useDefaultRenderers() {
  return useContext(DataGridDefaultRenderersContext);
}

function SelectCellFormatter({
  value,
  tabIndex,
  disabled,
  onChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy
}) {
  const renderCheckbox = useDefaultRenderers().renderCheckbox;
  return renderCheckbox({
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    tabIndex,
    disabled,
    checked: value,
    onChange
  });
}

const RowSelectionContext = /*#__PURE__*/createContext(undefined);
const RowSelectionProvider = RowSelectionContext.Provider;
const RowSelectionChangeContext = /*#__PURE__*/createContext(undefined);
const RowSelectionChangeProvider = RowSelectionChangeContext.Provider;
function useRowSelection() {
  const rowSelectionContext = useContext(RowSelectionContext);
  const rowSelectionChangeContext = useContext(RowSelectionChangeContext);
  if (rowSelectionContext === undefined || rowSelectionChangeContext === undefined) {
    throw new Error('useRowSelection must be used within DataGrid cells');
  }
  return [rowSelectionContext, rowSelectionChangeContext];
}

const SELECT_COLUMN_KEY = 'select-row';
function HeaderRenderer(props) {
  const [isRowSelected, onRowSelectionChange] = useRowSelection();
  return /*#__PURE__*/jsx(SelectCellFormatter, {
    "aria-label": "Select All",
    tabIndex: props.tabIndex,
    value: isRowSelected,
    onChange: checked => {
      onRowSelectionChange({
        type: 'HEADER',
        checked
      });
    }
  });
}
function SelectFormatter(props) {
  const [isRowSelected, onRowSelectionChange] = useRowSelection();
  return /*#__PURE__*/jsx(SelectCellFormatter, {
    "aria-label": "Select",
    tabIndex: props.tabIndex,
    value: isRowSelected,
    onChange: (checked, isShiftClick) => {
      onRowSelectionChange({
        type: 'ROW',
        row: props.row,
        checked,
        isShiftClick
      });
    }
  });
}
function SelectGroupFormatter(props) {
  const [isRowSelected, onRowSelectionChange] = useRowSelection();
  return /*#__PURE__*/jsx(SelectCellFormatter, {
    "aria-label": "Select Group",
    tabIndex: props.tabIndex,
    value: isRowSelected,
    onChange: checked => {
      onRowSelectionChange({
        type: 'ROW',
        row: props.row,
        checked,
        isShiftClick: false
      });
    }
  });
}
const SelectColumn = {
  key: SELECT_COLUMN_KEY,
  name: '',
  width: 35,
  minWidth: 35,
  maxWidth: 35,
  resizable: false,
  sortable: false,
  frozen: true,
  renderHeaderCell(props) {
    return /*#__PURE__*/jsx(HeaderRenderer, {
      ...props
    });
  },
  renderCell(props) {
    return /*#__PURE__*/jsx(SelectFormatter, {
      ...props
    });
  },
  renderGroupCell(props) {
    return /*#__PURE__*/jsx(SelectGroupFormatter, {
      ...props
    });
  }
};

const DEFAULT_COLUMN_WIDTH = 'auto';
const DEFAULT_COLUMN_MIN_WIDTH = 50;
function useCalculatedColumns({
  rawColumns,
  defaultColumnOptions,
  getColumnWidth,
  viewportWidth,
  scrollLeft,
  enableVirtualization
}) {
  const defaultWidth = defaultColumnOptions?.width ?? DEFAULT_COLUMN_WIDTH;
  const defaultMinWidth = defaultColumnOptions?.minWidth ?? DEFAULT_COLUMN_MIN_WIDTH;
  const defaultMaxWidth = defaultColumnOptions?.maxWidth ?? undefined;
  const defaultCellRenderer = defaultColumnOptions?.renderCell ?? renderValue;
  const defaultSortable = defaultColumnOptions?.sortable ?? false;
  const defaultResizable = defaultColumnOptions?.resizable ?? false;
  const defaultDraggable = defaultColumnOptions?.draggable ?? false;
  const {
    columns,
    colSpanColumns,
    lastFrozenColumnIndex,
    headerRowsCount
  } = useMemo(() => {
    let lastFrozenColumnIndex = -1;
    let headerRowsCount = 1;
    const columns = [];
    collectColumns(rawColumns, 1);
    function collectColumns(rawColumns, level, parent) {
      for (const rawColumn of rawColumns) {
        if ('children' in rawColumn) {
          const calculatedColumnParent = {
            name: rawColumn.name,
            parent,
            idx: -1,
            colSpan: 0,
            level: 0,
            headerCellClass: rawColumn.headerCellClass
          };
          collectColumns(rawColumn.children, level + 1, calculatedColumnParent);
          continue;
        }
        const frozen = rawColumn.frozen ?? false;
        const column = {
          ...rawColumn,
          parent,
          idx: 0,
          level: 0,
          frozen,
          width: rawColumn.width ?? defaultWidth,
          minWidth: rawColumn.minWidth ?? defaultMinWidth,
          maxWidth: rawColumn.maxWidth ?? defaultMaxWidth,
          sortable: rawColumn.sortable ?? defaultSortable,
          resizable: rawColumn.resizable ?? defaultResizable,
          draggable: rawColumn.draggable ?? defaultDraggable,
          renderCell: rawColumn.renderCell ?? defaultCellRenderer
        };
        columns.push(column);
        if (frozen) {
          lastFrozenColumnIndex++;
        }
        if (level > headerRowsCount) {
          headerRowsCount = level;
        }
      }
    }
    columns.sort(({
      key: aKey,
      frozen: frozenA
    }, {
      key: bKey,
      frozen: frozenB
    }) => {
      if (aKey === SELECT_COLUMN_KEY) return -1;
      if (bKey === SELECT_COLUMN_KEY) return 1;
      if (frozenA) {
        if (frozenB) return 0;
        return -1;
      }
      if (frozenB) return 1;
      return 0;
    });
    const colSpanColumns = [];
    columns.forEach((column, idx) => {
      column.idx = idx;
      updateColumnParent(column, idx, 0);
      if (column.colSpan != null) {
        colSpanColumns.push(column);
      }
    });
    return {
      columns,
      colSpanColumns,
      lastFrozenColumnIndex,
      headerRowsCount
    };
  }, [rawColumns, defaultWidth, defaultMinWidth, defaultMaxWidth, defaultCellRenderer, defaultResizable, defaultSortable, defaultDraggable]);
  const {
    templateColumns,
    layoutCssVars,
    totalFrozenColumnWidth,
    columnMetrics
  } = useMemo(() => {
    const columnMetrics = new Map();
    let left = 0;
    let totalFrozenColumnWidth = 0;
    const templateColumns = [];
    for (const column of columns) {
      let width = getColumnWidth(column);
      if (typeof width === 'number') {
        width = clampColumnWidth(width, column);
      } else {
        width = column.minWidth;
      }
      templateColumns.push(`${width}px`);
      columnMetrics.set(column, {
        width,
        left
      });
      left += width;
    }
    if (lastFrozenColumnIndex !== -1) {
      const columnMetric = columnMetrics.get(columns[lastFrozenColumnIndex]);
      totalFrozenColumnWidth = columnMetric.left + columnMetric.width;
    }
    const layoutCssVars = {};
    for (let i = 0; i <= lastFrozenColumnIndex; i++) {
      const column = columns[i];
      layoutCssVars[`--rdg-frozen-left-${column.idx}`] = `${columnMetrics.get(column).left}px`;
    }
    return {
      templateColumns,
      layoutCssVars,
      totalFrozenColumnWidth,
      columnMetrics
    };
  }, [getColumnWidth, columns, lastFrozenColumnIndex]);
  const [colOverscanStartIdx, colOverscanEndIdx] = useMemo(() => {
    if (!enableVirtualization) {
      return [0, columns.length - 1];
    }
    const viewportLeft = scrollLeft + totalFrozenColumnWidth;
    const viewportRight = scrollLeft + viewportWidth;
    const lastColIdx = columns.length - 1;
    const firstUnfrozenColumnIdx = min(lastFrozenColumnIndex + 1, lastColIdx);
    if (viewportLeft >= viewportRight) {
      return [firstUnfrozenColumnIdx, firstUnfrozenColumnIdx];
    }
    let colVisibleStartIdx = firstUnfrozenColumnIdx;
    while (colVisibleStartIdx < lastColIdx) {
      const {
        left,
        width
      } = columnMetrics.get(columns[colVisibleStartIdx]);
      if (left + width > viewportLeft) {
        break;
      }
      colVisibleStartIdx++;
    }
    let colVisibleEndIdx = colVisibleStartIdx;
    while (colVisibleEndIdx < lastColIdx) {
      const {
        left,
        width
      } = columnMetrics.get(columns[colVisibleEndIdx]);
      if (left + width >= viewportRight) {
        break;
      }
      colVisibleEndIdx++;
    }
    const colOverscanStartIdx = max(firstUnfrozenColumnIdx, colVisibleStartIdx - 1);
    const colOverscanEndIdx = min(lastColIdx, colVisibleEndIdx + 1);
    return [colOverscanStartIdx, colOverscanEndIdx];
  }, [columnMetrics, columns, lastFrozenColumnIndex, scrollLeft, totalFrozenColumnWidth, viewportWidth, enableVirtualization]);
  return {
    columns,
    colSpanColumns,
    colOverscanStartIdx,
    colOverscanEndIdx,
    templateColumns,
    layoutCssVars,
    headerRowsCount,
    lastFrozenColumnIndex,
    totalFrozenColumnWidth
  };
}
function updateColumnParent(column, index, level) {
  if (level < column.level) {
    column.level = level;
  }
  if (column.parent !== undefined) {
    const {
      parent
    } = column;
    if (parent.idx === -1) {
      parent.idx = index;
    }
    parent.colSpan += 1;
    updateColumnParent(parent, index, level - 1);
  }
}

const useLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect$1;

function useColumnWidths(columns, viewportColumns, templateColumns, gridRef, gridWidth, resizedColumnWidths, measuredColumnWidths, setResizedColumnWidths, setMeasuredColumnWidths, onColumnResize) {
  const prevGridWidthRef = useRef(gridWidth);
  const columnsCanFlex = columns.length === viewportColumns.length;
  const ignorePreviouslyMeasuredColumns = columnsCanFlex && gridWidth !== prevGridWidthRef.current;
  const newTemplateColumns = [...templateColumns];
  const columnsToMeasure = [];
  for (const {
    key,
    idx,
    width
  } of viewportColumns) {
    if (typeof width === 'string' && (ignorePreviouslyMeasuredColumns || !measuredColumnWidths.has(key)) && !resizedColumnWidths.has(key)) {
      newTemplateColumns[idx] = width;
      columnsToMeasure.push(key);
    }
  }
  const gridTemplateColumns = newTemplateColumns.join(' ');
  useLayoutEffect(() => {
    prevGridWidthRef.current = gridWidth;
    updateMeasuredWidths(columnsToMeasure);
  });
  function updateMeasuredWidths(columnsToMeasure) {
    if (columnsToMeasure.length === 0) return;
    setMeasuredColumnWidths(measuredColumnWidths => {
      const newMeasuredColumnWidths = new Map(measuredColumnWidths);
      let hasChanges = false;
      for (const key of columnsToMeasure) {
        const measuredWidth = measureColumnWidth(gridRef, key);
        hasChanges ||= measuredWidth !== measuredColumnWidths.get(key);
        if (measuredWidth === undefined) {
          newMeasuredColumnWidths.delete(key);
        } else {
          newMeasuredColumnWidths.set(key, measuredWidth);
        }
      }
      return hasChanges ? newMeasuredColumnWidths : measuredColumnWidths;
    });
  }
  function handleColumnResize(column, nextWidth) {
    const {
      key: resizingKey
    } = column;
    const newTemplateColumns = [...templateColumns];
    const columnsToMeasure = [];
    for (const {
      key,
      idx,
      width
    } of viewportColumns) {
      if (resizingKey === key) {
        const width = typeof nextWidth === 'number' ? `${nextWidth}px` : nextWidth;
        newTemplateColumns[idx] = width;
      } else if (columnsCanFlex && typeof width === 'string' && !resizedColumnWidths.has(key)) {
        newTemplateColumns[idx] = width;
        columnsToMeasure.push(key);
      }
    }
    gridRef.current.style.gridTemplateColumns = newTemplateColumns.join(' ');
    const measuredWidth = typeof nextWidth === 'number' ? nextWidth : measureColumnWidth(gridRef, resizingKey);
    flushSync(() => {
      setResizedColumnWidths(resizedColumnWidths => {
        const newResizedColumnWidths = new Map(resizedColumnWidths);
        newResizedColumnWidths.set(resizingKey, measuredWidth);
        return newResizedColumnWidths;
      });
      updateMeasuredWidths(columnsToMeasure);
    });
    onColumnResize?.(column.idx, measuredWidth);
  }
  return {
    gridTemplateColumns,
    handleColumnResize
  };
}
function measureColumnWidth(gridRef, key) {
  const selector = `[data-measuring-cell-key="${CSS.escape(key)}"]`;
  const measuringCell = gridRef.current.querySelector(selector);
  return measuringCell?.getBoundingClientRect().width;
}

function useGridDimensions() {
  const gridRef = useRef(null);
  const [inlineSize, setInlineSize] = useState(1);
  const [blockSize, setBlockSize] = useState(1);
  useLayoutEffect(() => {
    const {
      ResizeObserver
    } = window;
    if (ResizeObserver == null) return;
    const {
      clientWidth,
      clientHeight,
      offsetWidth,
      offsetHeight
    } = gridRef.current;
    const {
      width,
      height
    } = gridRef.current.getBoundingClientRect();
    const initialWidth = width - offsetWidth + clientWidth;
    const initialHeight = height - offsetHeight + clientHeight;
    setInlineSize(initialWidth);
    setBlockSize(initialHeight);
    const resizeObserver = new ResizeObserver(entries => {
      const size = entries[0].contentBoxSize[0];
      flushSync(() => {
        setInlineSize(size.inlineSize);
        setBlockSize(size.blockSize);
      });
    });
    resizeObserver.observe(gridRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  return [gridRef, inlineSize, blockSize];
}

function useLatestFunc(fn) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  const callbackFn = useCallback((...args) => {
    ref.current(...args);
  }, []);
  return fn ? callbackFn : fn;
}

function useRovingTabIndex(isSelected) {
  const [isChildFocused, setIsChildFocused] = useState(false);
  if (isChildFocused && !isSelected) {
    setIsChildFocused(false);
  }
  function onFocus(event) {
    if (event.target !== event.currentTarget) {
      setIsChildFocused(true);
    }
  }
  const isFocusable = isSelected && !isChildFocused;
  return {
    tabIndex: isFocusable ? 0 : -1,
    childTabIndex: isSelected ? 0 : -1,
    onFocus: isSelected ? onFocus : undefined
  };
}

function useViewportColumns({
  columns,
  colSpanColumns,
  rows,
  topSummaryRows,
  bottomSummaryRows,
  colOverscanStartIdx,
  colOverscanEndIdx,
  lastFrozenColumnIndex,
  rowOverscanStartIdx,
  rowOverscanEndIdx
}) {
  const startIdx = useMemo(() => {
    if (colOverscanStartIdx === 0) return 0;
    let startIdx = colOverscanStartIdx;
    const updateStartIdx = (colIdx, colSpan) => {
      if (colSpan !== undefined && colIdx + colSpan > colOverscanStartIdx) {
        startIdx = colIdx;
        return true;
      }
      return false;
    };
    for (const column of colSpanColumns) {
      const colIdx = column.idx;
      if (colIdx >= startIdx) break;
      if (updateStartIdx(colIdx, getColSpan(column, lastFrozenColumnIndex, {
        type: 'HEADER'
      }))) {
        break;
      }
      for (let rowIdx = rowOverscanStartIdx; rowIdx <= rowOverscanEndIdx; rowIdx++) {
        const row = rows[rowIdx];
        if (updateStartIdx(colIdx, getColSpan(column, lastFrozenColumnIndex, {
          type: 'ROW',
          row
        }))) {
          break;
        }
      }
      if (topSummaryRows != null) {
        for (const row of topSummaryRows) {
          if (updateStartIdx(colIdx, getColSpan(column, lastFrozenColumnIndex, {
            type: 'SUMMARY',
            row
          }))) {
            break;
          }
        }
      }
      if (bottomSummaryRows != null) {
        for (const row of bottomSummaryRows) {
          if (updateStartIdx(colIdx, getColSpan(column, lastFrozenColumnIndex, {
            type: 'SUMMARY',
            row
          }))) {
            break;
          }
        }
      }
    }
    return startIdx;
  }, [rowOverscanStartIdx, rowOverscanEndIdx, rows, topSummaryRows, bottomSummaryRows, colOverscanStartIdx, lastFrozenColumnIndex, colSpanColumns]);
  return useMemo(() => {
    const viewportColumns = [];
    for (let colIdx = 0; colIdx <= colOverscanEndIdx; colIdx++) {
      const column = columns[colIdx];
      if (colIdx < startIdx && !column.frozen) continue;
      viewportColumns.push(column);
    }
    return viewportColumns;
  }, [startIdx, colOverscanEndIdx, columns]);
}

function useViewportRows({
  rows,
  rowHeight,
  clientHeight,
  scrollTop,
  enableVirtualization
}) {
  const {
    totalRowHeight,
    gridTemplateRows,
    getRowTop,
    getRowHeight,
    findRowIdx
  } = useMemo(() => {
    if (typeof rowHeight === 'number') {
      return {
        totalRowHeight: rowHeight * rows.length,
        gridTemplateRows: ` repeat(${rows.length}, ${rowHeight}px)`,
        getRowTop: rowIdx => rowIdx * rowHeight,
        getRowHeight: () => rowHeight,
        findRowIdx: offset => floor(offset / rowHeight)
      };
    }
    let totalRowHeight = 0;
    let gridTemplateRows = ' ';
    const rowPositions = rows.map(row => {
      const currentRowHeight = rowHeight(row);
      const position = {
        top: totalRowHeight,
        height: currentRowHeight
      };
      gridTemplateRows += `${currentRowHeight}px `;
      totalRowHeight += currentRowHeight;
      return position;
    });
    const validateRowIdx = rowIdx => {
      return max(0, min(rows.length - 1, rowIdx));
    };
    return {
      totalRowHeight,
      gridTemplateRows,
      getRowTop: rowIdx => rowPositions[validateRowIdx(rowIdx)].top,
      getRowHeight: rowIdx => rowPositions[validateRowIdx(rowIdx)].height,
      findRowIdx(offset) {
        let start = 0;
        let end = rowPositions.length - 1;
        while (start <= end) {
          const middle = start + floor((end - start) / 2);
          const currentOffset = rowPositions[middle].top;
          if (currentOffset === offset) return middle;
          if (currentOffset < offset) {
            start = middle + 1;
          } else if (currentOffset > offset) {
            end = middle - 1;
          }
          if (start > end) return end;
        }
        return 0;
      }
    };
  }, [rowHeight, rows]);
  let rowOverscanStartIdx = 0;
  let rowOverscanEndIdx = rows.length - 1;
  if (enableVirtualization) {
    const overscanThreshold = 4;
    const rowVisibleStartIdx = findRowIdx(scrollTop);
    const rowVisibleEndIdx = findRowIdx(scrollTop + clientHeight);
    rowOverscanStartIdx = max(0, rowVisibleStartIdx - overscanThreshold);
    rowOverscanEndIdx = min(rows.length - 1, rowVisibleEndIdx + overscanThreshold);
  }
  return {
    rowOverscanStartIdx,
    rowOverscanEndIdx,
    totalRowHeight,
    gridTemplateRows,
    getRowTop,
    getRowHeight,
    findRowIdx
  };
}

const cellCopied = "c6ra8a37-0-0-beta-42";
const cellCopiedClassname = `rdg-cell-copied ${cellCopied}`;
const cellDraggedOver = "cq910m07-0-0-beta-42";
const cellDraggedOverClassname = `rdg-cell-dragged-over ${cellDraggedOver}`;
function Cell({
  column,
  colSpan,
  isCellSelected,
  isCopied,
  isDraggedOver,
  row,
  rowIdx,
  className,
  onClick,
  onDoubleClick,
  onContextMenu,
  onRowChange,
  selectCell,
  ...props
}, ref) {
  const {
    tabIndex,
    childTabIndex,
    onFocus
  } = useRovingTabIndex(isCellSelected);
  const {
    cellClass
  } = column;
  className = getCellClassname(column, typeof cellClass === 'function' ? cellClass(row) : cellClass, className, isCopied && cellCopiedClassname, isDraggedOver && cellDraggedOverClassname);
  const isEditable = isCellEditableUtil(column, row);
  function selectCellWrapper(openEditor) {
    selectCell({
      rowIdx,
      idx: column.idx
    }, openEditor);
  }
  function handleClick(event) {
    if (onClick) {
      const cellEvent = createCellEvent(event);
      onClick({
        row,
        column,
        selectCell: selectCellWrapper
      }, cellEvent);
      if (cellEvent.isGridDefaultPrevented()) return;
    }
    selectCellWrapper();
  }
  function handleContextMenu(event) {
    if (onContextMenu) {
      const cellEvent = createCellEvent(event);
      onContextMenu({
        row,
        column,
        selectCell: selectCellWrapper
      }, cellEvent);
      if (cellEvent.isGridDefaultPrevented()) return;
    }
    selectCellWrapper();
  }
  function handleDoubleClick(event) {
    if (onDoubleClick) {
      const cellEvent = createCellEvent(event);
      onDoubleClick({
        row,
        column,
        selectCell: selectCellWrapper
      }, cellEvent);
      if (cellEvent.isGridDefaultPrevented()) return;
    }
    selectCellWrapper(true);
  }
  function handleRowChange(newRow) {
    onRowChange(column, newRow);
  }
  return /*#__PURE__*/jsx("div", {
    role: "gridcell",
    "aria-colindex": column.idx + 1,
    "aria-colspan": colSpan,
    "aria-selected": isCellSelected,
    "aria-readonly": !isEditable || undefined,
    ref: ref,
    tabIndex: tabIndex,
    className: className,
    style: getCellStyle(column, colSpan),
    onClick: handleClick,
    onDoubleClick: handleDoubleClick,
    onContextMenu: handleContextMenu,
    onFocus: onFocus,
    ...props,
    children: column.renderCell({
      column,
      row,
      rowIdx,
      isCellEditable: isEditable,
      tabIndex: childTabIndex,
      onRowChange: handleRowChange
    })
  });
}
const CellComponent = /*#__PURE__*/memo( /*#__PURE__*/forwardRef(Cell));
const CellComponent$1 = CellComponent;
function defaultRenderCell(key, props) {
  return /*#__PURE__*/jsx(CellComponent, {
    ...props
  }, key);
}

const cellDragHandle = "c1w9bbhr7-0-0-beta-42";
const cellDragHandleFrozenClassname = "c1creorc7-0-0-beta-42";
const cellDragHandleClassname = `rdg-cell-drag-handle ${cellDragHandle}`;
function DragHandle({
  gridRowStart,
  rows,
  column,
  columnWidth,
  maxColIdx,
  isLastRow,
  selectedPosition,
  latestDraggedOverRowIdx,
  isCellEditable,
  onRowsChange,
  onFill,
  onClick,
  setDragging,
  setDraggedOverRowIdx
}) {
  const {
    idx,
    rowIdx
  } = selectedPosition;
  function handleMouseDown(event) {
    event.preventDefault();
    if (event.buttons !== 1) return;
    setDragging(true);
    window.addEventListener('mouseover', onMouseOver);
    window.addEventListener('mouseup', onMouseUp);
    function onMouseOver(event) {
      if (event.buttons !== 1) onMouseUp();
    }
    function onMouseUp() {
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mouseup', onMouseUp);
      setDragging(false);
      handleDragEnd();
    }
  }
  function handleDragEnd() {
    const overRowIdx = latestDraggedOverRowIdx.current;
    if (overRowIdx === undefined) return;
    const startRowIndex = rowIdx < overRowIdx ? rowIdx + 1 : overRowIdx;
    const endRowIndex = rowIdx < overRowIdx ? overRowIdx + 1 : rowIdx;
    updateRows(startRowIndex, endRowIndex);
    setDraggedOverRowIdx(undefined);
  }
  function handleDoubleClick(event) {
    event.stopPropagation();
    updateRows(rowIdx + 1, rows.length);
  }
  function updateRows(startRowIdx, endRowIdx) {
    const sourceRow = rows[rowIdx];
    const updatedRows = [...rows];
    const indexes = [];
    for (let i = startRowIdx; i < endRowIdx; i++) {
      if (isCellEditable({
        rowIdx: i,
        idx
      })) {
        const updatedRow = onFill({
          columnKey: column.key,
          sourceRow,
          targetRow: rows[i]
        });
        if (updatedRow !== rows[i]) {
          updatedRows[i] = updatedRow;
          indexes.push(i);
        }
      }
    }
    if (indexes.length > 0) {
      onRowsChange?.(updatedRows, {
        indexes,
        column
      });
    }
  }
  function getStyle() {
    const colSpan = column.colSpan?.({
      type: 'ROW',
      row: rows[rowIdx]
    }) ?? 1;
    const {
      insetInlineStart,
      ...style
    } = getCellStyle(column, colSpan);
    const marginEnd = 'calc(var(--rdg-drag-handle-size) * -0.5 + 1px)';
    const isLastColumn = column.idx + colSpan - 1 === maxColIdx;
    return {
      ...style,
      gridRowStart,
      marginInlineEnd: isLastColumn ? undefined : marginEnd,
      marginBlockEnd: isLastRow ? undefined : marginEnd,
      insetInlineStart: insetInlineStart ? `calc(${insetInlineStart} + ${columnWidth}px + var(--rdg-drag-handle-size) * -0.5 - 1px)` : undefined
    };
  }
  return /*#__PURE__*/jsx("div", {
    style: getStyle(),
    className: clsx(cellDragHandleClassname, column.frozen && cellDragHandleFrozenClassname),
    onClick: onClick,
    onMouseDown: handleMouseDown,
    onDoubleClick: handleDoubleClick
  });
}

const cellEditing = "cis5rrm7-0-0-beta-42";
function EditCell({
  column,
  colSpan,
  row,
  rowIdx,
  onRowChange,
  closeEditor,
  onKeyDown,
  navigate
}) {
  const frameRequestRef = useRef();
  const commitOnOutsideClick = column.editorOptions?.commitOnOutsideClick !== false;
  const commitOnOutsideMouseDown = useLatestFunc(() => {
    onClose(true, false);
  });
  useEffect(() => {
    if (!commitOnOutsideClick) return;
    function onWindowCaptureMouseDown() {
      frameRequestRef.current = requestAnimationFrame(commitOnOutsideMouseDown);
    }
    addEventListener('mousedown', onWindowCaptureMouseDown, {
      capture: true
    });
    return () => {
      removeEventListener('mousedown', onWindowCaptureMouseDown, {
        capture: true
      });
      cancelFrameRequest();
    };
  }, [commitOnOutsideClick, commitOnOutsideMouseDown]);
  function cancelFrameRequest() {
    cancelAnimationFrame(frameRequestRef.current);
  }
  function handleKeyDown(event) {
    if (onKeyDown) {
      const cellEvent = createCellEvent(event);
      onKeyDown({
        mode: 'EDIT',
        row,
        column,
        rowIdx,
        navigate() {
          navigate(event);
        },
        onClose
      }, cellEvent);
      if (cellEvent.isGridDefaultPrevented()) return;
    }
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'Enter') {
      onClose(true);
    } else if (onEditorNavigation(event)) {
      navigate(event);
    }
  }
  function onClose(commitChanges = false, shouldFocusCell = true) {
    if (commitChanges) {
      onRowChange(row, true, shouldFocusCell);
    } else {
      closeEditor(shouldFocusCell);
    }
  }
  function onEditorRowChange(row, commitChangesAndFocus = false) {
    onRowChange(row, commitChangesAndFocus, commitChangesAndFocus);
  }
  const {
    cellClass
  } = column;
  const className = getCellClassname(column, 'rdg-editor-container', typeof cellClass === 'function' ? cellClass(row) : cellClass, !column.editorOptions?.displayCellContent && cellEditing);
  return /*#__PURE__*/jsx("div", {
    role: "gridcell",
    "aria-colindex": column.idx + 1,
    "aria-colspan": colSpan,
    "aria-selected": true,
    className: className,
    style: getCellStyle(column, colSpan),
    onKeyDown: handleKeyDown,
    onMouseDownCapture: cancelFrameRequest,
    children: column.renderEditCell != null && /*#__PURE__*/jsxs(Fragment, {
      children: [column.renderEditCell({
        column,
        row,
        onRowChange: onEditorRowChange,
        onClose
      }), column.editorOptions?.displayCellContent && column.renderCell({
        column,
        row,
        rowIdx,
        isCellEditable: true,
        tabIndex: -1,
        onRowChange: onEditorRowChange
      })]
    })
  });
}

function GroupedColumnHeaderCell({
  column,
  rowIdx,
  isCellSelected,
  selectCell
}) {
  const {
    tabIndex,
    onFocus
  } = useRovingTabIndex(isCellSelected);
  const {
    colSpan
  } = column;
  const rowSpan = getHeaderCellRowSpan(column, rowIdx);
  const index = column.idx + 1;
  function onClick() {
    selectCell({
      idx: column.idx,
      rowIdx
    });
  }
  return /*#__PURE__*/jsx("div", {
    role: "columnheader",
    "aria-colindex": index,
    "aria-colspan": colSpan,
    "aria-rowspan": rowSpan,
    "aria-selected": isCellSelected,
    tabIndex: tabIndex,
    className: clsx(cellClassname, column.headerCellClass),
    style: {
      ...getHeaderCellStyle(column, rowIdx, rowSpan),
      gridColumnStart: index,
      gridColumnEnd: index + colSpan
    },
    onFocus: onFocus,
    onClick: onClick,
    children: column.name
  });
}

const headerSortCellClassname = "h44jtk67-0-0-beta-42";
const headerSortName = "hcgkhxz7-0-0-beta-42";
const headerSortNameClassname = `rdg-header-sort-name ${headerSortName}`;
function renderHeaderCell({
  column,
  sortDirection,
  priority
}) {
  if (!column.sortable) return column.name;
  return /*#__PURE__*/jsx(SortableHeaderCell, {
    sortDirection: sortDirection,
    priority: priority,
    children: column.name
  });
}
function SortableHeaderCell({
  sortDirection,
  priority,
  children
}) {
  const renderSortStatus = useDefaultRenderers().renderSortStatus;
  return /*#__PURE__*/jsxs("span", {
    className: headerSortCellClassname,
    children: [/*#__PURE__*/jsx("span", {
      className: headerSortNameClassname,
      children: children
    }), /*#__PURE__*/jsx("span", {
      children: renderSortStatus({
        sortDirection,
        priority
      })
    })]
  });
}

const cellSortableClassname = "c6l2wv17-0-0-beta-42";
const cellResizable = "c1kqdw7y7-0-0-beta-42";
const cellResizableClassname = `rdg-cell-resizable ${cellResizable}`;
const resizeHandleClassname = "r1y6ywlx7-0-0-beta-42";
const cellDraggableClassname = 'rdg-cell-draggable';
const cellDragging = "c1bezg5o7-0-0-beta-42";
const cellDraggingClassname = `rdg-cell-dragging ${cellDragging}`;
const cellOver = "c1vc96037-0-0-beta-42";
const cellOverClassname = `rdg-cell-drag-over ${cellOver}`;
function HeaderCell({
  column,
  colSpan,
  rowIdx,
  isCellSelected,
  onColumnResize,
  onColumnsReorder,
  sortColumns,
  onSortColumnsChange,
  selectCell,
  shouldFocusGrid,
  direction,
  dragDropKey
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const isRtl = direction === 'rtl';
  const rowSpan = getHeaderCellRowSpan(column, rowIdx);
  const {
    tabIndex,
    childTabIndex,
    onFocus
  } = useRovingTabIndex(isCellSelected);
  const sortIndex = sortColumns?.findIndex(sort => sort.columnKey === column.key);
  const sortColumn = sortIndex !== undefined && sortIndex > -1 ? sortColumns[sortIndex] : undefined;
  const sortDirection = sortColumn?.direction;
  const priority = sortColumn !== undefined && sortColumns.length > 1 ? sortIndex + 1 : undefined;
  const ariaSort = sortDirection && !priority ? sortDirection === 'ASC' ? 'ascending' : 'descending' : undefined;
  const {
    sortable,
    resizable,
    draggable
  } = column;
  const className = getCellClassname(column, column.headerCellClass, sortable && cellSortableClassname, resizable && cellResizableClassname, draggable && cellDraggableClassname, isDragging && cellDraggingClassname, isOver && cellOverClassname);
  const renderHeaderCell$1 = column.renderHeaderCell ?? renderHeaderCell;
  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.buttons !== 1) {
      return;
    }
    event.preventDefault();
    const {
      currentTarget,
      pointerId
    } = event;
    const headerCell = currentTarget.parentElement;
    const {
      right,
      left
    } = headerCell.getBoundingClientRect();
    const offset = isRtl ? event.clientX - left : right - event.clientX;
    function onPointerMove(event) {
      const {
        right,
        left
      } = headerCell.getBoundingClientRect();
      const width = isRtl ? right + offset - event.clientX : event.clientX + offset - left;
      if (width > 0) {
        onColumnResize(column, clampColumnWidth(width, column));
      }
    }
    function onLostPointerCapture() {
      currentTarget.removeEventListener('pointermove', onPointerMove);
      currentTarget.removeEventListener('lostpointercapture', onLostPointerCapture);
    }
    currentTarget.setPointerCapture(pointerId);
    currentTarget.addEventListener('pointermove', onPointerMove);
    currentTarget.addEventListener('lostpointercapture', onLostPointerCapture);
  }
  function onSort(ctrlClick) {
    if (onSortColumnsChange == null) return;
    const {
      sortDescendingFirst
    } = column;
    if (sortColumn === undefined) {
      const nextSort = {
        columnKey: column.key,
        direction: sortDescendingFirst ? 'DESC' : 'ASC'
      };
      onSortColumnsChange(sortColumns && ctrlClick ? [...sortColumns, nextSort] : [nextSort]);
    } else {
      let nextSortColumn;
      if (sortDescendingFirst === true && sortDirection === 'DESC' || sortDescendingFirst !== true && sortDirection === 'ASC') {
        nextSortColumn = {
          columnKey: column.key,
          direction: sortDirection === 'ASC' ? 'DESC' : 'ASC'
        };
      }
      if (ctrlClick) {
        const nextSortColumns = [...sortColumns];
        if (nextSortColumn) {
          nextSortColumns[sortIndex] = nextSortColumn;
        } else {
          nextSortColumns.splice(sortIndex, 1);
        }
        onSortColumnsChange(nextSortColumns);
      } else {
        onSortColumnsChange(nextSortColumn ? [nextSortColumn] : []);
      }
    }
  }
  function onClick(event) {
    selectCell({
      idx: column.idx,
      rowIdx
    });
    if (sortable) {
      onSort(event.ctrlKey || event.metaKey);
    }
  }
  function onDoubleClick() {
    onColumnResize(column, 'max-content');
  }
  function handleFocus(event) {
    onFocus?.(event);
    if (shouldFocusGrid) {
      selectCell({
        idx: 0,
        rowIdx
      });
    }
  }
  function onKeyDown(event) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onSort(event.ctrlKey || event.metaKey);
    }
  }
  function onDragStart(event) {
    event.dataTransfer.setData(dragDropKey, column.key);
    event.dataTransfer.dropEffect = 'move';
    setIsDragging(true);
  }
  function onDragEnd() {
    setIsDragging(false);
  }
  function onDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }
  function onDrop(event) {
    setIsOver(false);
    if (event.dataTransfer.types.includes(dragDropKey)) {
      const sourceKey = event.dataTransfer.getData(dragDropKey);
      if (sourceKey !== column.key) {
        event.preventDefault();
        onColumnsReorder?.(sourceKey, column.key);
      }
    }
  }
  function onDragEnter(event) {
    if (isEventPertinent(event)) {
      setIsOver(true);
    }
  }
  function onDragLeave(event) {
    if (isEventPertinent(event)) {
      setIsOver(false);
    }
  }
  let draggableProps;
  if (draggable) {
    draggableProps = {
      draggable: true,
      onDragStart,
      onDragEnd,
      onDragOver,
      onDragEnter,
      onDragLeave,
      onDrop
    };
  }
  return /*#__PURE__*/jsxs("div", {
    role: "columnheader",
    "aria-colindex": column.idx + 1,
    "aria-colspan": colSpan,
    "aria-rowspan": rowSpan,
    "aria-selected": isCellSelected,
    "aria-sort": ariaSort,
    tabIndex: shouldFocusGrid ? 0 : tabIndex,
    className: className,
    style: {
      ...getHeaderCellStyle(column, rowIdx, rowSpan),
      ...getCellStyle(column, colSpan)
    },
    onFocus: handleFocus,
    onClick: onClick,
    onKeyDown: sortable ? onKeyDown : undefined,
    ...draggableProps,
    children: [renderHeaderCell$1({
      column,
      sortDirection,
      priority,
      tabIndex: childTabIndex
    }), resizable && /*#__PURE__*/jsx("div", {
      className: resizeHandleClassname,
      onClick: stopPropagation,
      onDoubleClick: onDoubleClick,
      onPointerDown: onPointerDown
    })]
  });
}
function isEventPertinent(event) {
  const relatedTarget = event.relatedTarget;
  return !event.currentTarget.contains(relatedTarget);
}

const row = "r1upfr807-0-0-beta-42";
const rowClassname = `rdg-row ${row}`;
const rowSelected = "r190mhd37-0-0-beta-42";
const rowSelectedClassname = 'rdg-row-selected';
const rowSelectedWithFrozenCell = "r139qu9m7-0-0-beta-42";
const topSummaryRowClassname = 'rdg-top-summary-row';
const bottomSummaryRowClassname = 'rdg-bottom-summary-row';

const headerRow = "h10tskcx7-0-0-beta-42";
const headerRowClassname = `rdg-header-row ${headerRow}`;
function HeaderRow({
  rowIdx,
  columns,
  onColumnResize,
  onColumnsReorder,
  sortColumns,
  onSortColumnsChange,
  lastFrozenColumnIndex,
  selectedCellIdx,
  selectCell,
  shouldFocusGrid,
  direction
}) {
  const dragDropKey = useId();
  const cells = [];
  for (let index = 0; index < columns.length; index++) {
    const column = columns[index];
    const colSpan = getColSpan(column, lastFrozenColumnIndex, {
      type: 'HEADER'
    });
    if (colSpan !== undefined) {
      index += colSpan - 1;
    }
    cells.push( /*#__PURE__*/jsx(HeaderCell, {
      column: column,
      colSpan: colSpan,
      rowIdx: rowIdx,
      isCellSelected: selectedCellIdx === column.idx,
      onColumnResize: onColumnResize,
      onColumnsReorder: onColumnsReorder,
      onSortColumnsChange: onSortColumnsChange,
      sortColumns: sortColumns,
      selectCell: selectCell,
      shouldFocusGrid: shouldFocusGrid && index === 0,
      direction: direction,
      dragDropKey: dragDropKey
    }, column.key));
  }
  return /*#__PURE__*/jsx("div", {
    role: "row",
    "aria-rowindex": rowIdx,
    className: clsx(headerRowClassname, selectedCellIdx === -1 && rowSelectedClassname),
    children: cells
  });
}
const HeaderRow$1 = /*#__PURE__*/memo(HeaderRow);

function GroupedColumnHeaderRow({
  rowIdx,
  level,
  columns,
  selectedCellIdx,
  selectCell
}) {
  const cells = [];
  const renderedParents = new Set();
  for (const column of columns) {
    let {
      parent
    } = column;
    if (parent === undefined) continue;
    while (parent.level > level) {
      if (parent.parent === undefined) break;
      parent = parent.parent;
    }
    if (parent.level === level && !renderedParents.has(parent)) {
      renderedParents.add(parent);
      const {
        idx
      } = parent;
      cells.push( /*#__PURE__*/jsx(GroupedColumnHeaderCell, {
        column: parent,
        rowIdx: rowIdx,
        isCellSelected: selectedCellIdx === idx,
        selectCell: selectCell
      }, idx));
    }
  }
  return /*#__PURE__*/jsx("div", {
    role: "row",
    "aria-rowindex": rowIdx,
    className: headerRowClassname,
    children: cells
  });
}
const GroupedColumnHeaderRow$1 = /*#__PURE__*/memo(GroupedColumnHeaderRow);

function Row({
  className,
  rowIdx,
  gridRowStart,
  height,
  selectedCellIdx,
  isRowSelected,
  copiedCellIdx,
  draggedOverCellIdx,
  lastFrozenColumnIndex,
  row,
  viewportColumns,
  selectedCellEditor,
  onCellClick,
  onCellDoubleClick,
  onCellContextMenu,
  rowClass,
  setDraggedOverRowIdx,
  onMouseEnter,
  onRowChange,
  selectCell,
  ...props
}, ref) {
  const renderCell = useDefaultRenderers().renderCell;
  const handleRowChange = useLatestFunc((column, newRow) => {
    onRowChange(column, rowIdx, newRow);
  });
  function handleDragEnter(event) {
    setDraggedOverRowIdx?.(rowIdx);
    onMouseEnter?.(event);
  }
  className = clsx(rowClassname, `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`, rowClass?.(row, rowIdx), className, selectedCellIdx === -1 && rowSelectedClassname);
  const cells = [];
  for (let index = 0; index < viewportColumns.length; index++) {
    const column = viewportColumns[index];
    const {
      idx
    } = column;
    const colSpan = getColSpan(column, lastFrozenColumnIndex, {
      type: 'ROW',
      row
    });
    if (colSpan !== undefined) {
      index += colSpan - 1;
    }
    const isCellSelected = selectedCellIdx === idx;
    if (isCellSelected && selectedCellEditor) {
      cells.push(selectedCellEditor);
    } else {
      cells.push(renderCell(column.key, {
        column,
        colSpan,
        row,
        rowIdx,
        isCopied: copiedCellIdx === idx,
        isDraggedOver: draggedOverCellIdx === idx,
        isCellSelected,
        onClick: onCellClick,
        onDoubleClick: onCellDoubleClick,
        onContextMenu: onCellContextMenu,
        onRowChange: handleRowChange,
        selectCell
      }));
    }
  }
  return /*#__PURE__*/jsx(RowSelectionProvider, {
    value: isRowSelected,
    children: /*#__PURE__*/jsx("div", {
      role: "row",
      ref: ref,
      className: className,
      onMouseEnter: handleDragEnter,
      style: getRowStyle(gridRowStart, height),
      ...props,
      children: cells
    })
  });
}
const RowComponent = /*#__PURE__*/memo( /*#__PURE__*/forwardRef(Row));
const RowComponent$1 = RowComponent;
function defaultRenderRow(key, props) {
  return /*#__PURE__*/jsx(RowComponent, {
    ...props
  }, key);
}

function ScrollToCell({
  scrollToPosition: {
    idx,
    rowIdx
  },
  gridElement,
  setScrollToCellPosition
}) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    scrollIntoView(ref.current);
  });
  useLayoutEffect(() => {
    function removeScrollToCell() {
      setScrollToCellPosition(null);
    }
    const observer = new IntersectionObserver(removeScrollToCell, {
      root: gridElement,
      threshold: 1.0
    });
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
  }, [gridElement, setScrollToCellPosition]);
  return /*#__PURE__*/jsx("div", {
    ref: ref,
    style: {
      gridColumn: idx === undefined ? '1/-1' : idx + 1,
      gridRow: rowIdx === undefined ? '1/-1' : rowIdx + 2
    }
  });
}

const arrow = "a3ejtar7-0-0-beta-42";
const arrowClassname = `rdg-sort-arrow ${arrow}`;
function renderSortStatus({
  sortDirection,
  priority
}) {
  return /*#__PURE__*/jsxs(Fragment, {
    children: [renderSortIcon({
      sortDirection
    }), renderSortPriority({
      priority
    })]
  });
}
function renderSortIcon({
  sortDirection
}) {
  if (sortDirection === undefined) return null;
  return /*#__PURE__*/jsx("svg", {
    viewBox: "0 0 12 8",
    width: "12",
    height: "8",
    className: arrowClassname,
    "aria-hidden": true,
    children: /*#__PURE__*/jsx("path", {
      d: sortDirection === 'ASC' ? 'M0 8 6 0 12 8' : 'M0 0 6 8 12 0'
    })
  });
}
function renderSortPriority({
  priority
}) {
  return priority;
}

const root = "rnvodz57-0-0-beta-42";
const rootClassname = `rdg ${root}`;
const viewportDragging = "vlqv91k7-0-0-beta-42";
const viewportDraggingClassname = `rdg-viewport-dragging ${viewportDragging}`;
const focusSinkClassname = "f1lsfrzw7-0-0-beta-42";
const focusSinkHeaderAndSummaryClassname = "f1cte0lg7-0-0-beta-42";

const summaryCellClassname = "s8wc6fl7-0-0-beta-42";
function SummaryCell({
  column,
  colSpan,
  row,
  rowIdx,
  isCellSelected,
  selectCell
}) {
  const {
    tabIndex,
    childTabIndex,
    onFocus
  } = useRovingTabIndex(isCellSelected);
  const {
    summaryCellClass
  } = column;
  const className = getCellClassname(column, summaryCellClassname, typeof summaryCellClass === 'function' ? summaryCellClass(row) : summaryCellClass);
  function onClick() {
    selectCell({
      rowIdx,
      idx: column.idx
    });
  }
  return /*#__PURE__*/jsx("div", {
    role: "gridcell",
    "aria-colindex": column.idx + 1,
    "aria-colspan": colSpan,
    "aria-selected": isCellSelected,
    tabIndex: tabIndex,
    className: className,
    style: getCellStyle(column, colSpan),
    onClick: onClick,
    onFocus: onFocus,
    children: column.renderSummaryCell?.({
      column,
      row,
      tabIndex: childTabIndex
    })
  });
}
const SummaryCell$1 = /*#__PURE__*/memo(SummaryCell);

const summaryRow = "skuhp557-0-0-beta-42";
const topSummaryRow = "tf8l5ub7-0-0-beta-42";
const summaryRowClassname = `rdg-summary-row ${summaryRow}`;
function SummaryRow({
  rowIdx,
  gridRowStart,
  row,
  viewportColumns,
  top,
  bottom,
  lastFrozenColumnIndex,
  selectedCellIdx,
  isTop,
  selectCell,
  'aria-rowindex': ariaRowIndex
}) {
  const cells = [];
  for (let index = 0; index < viewportColumns.length; index++) {
    const column = viewportColumns[index];
    const colSpan = getColSpan(column, lastFrozenColumnIndex, {
      type: 'SUMMARY',
      row
    });
    if (colSpan !== undefined) {
      index += colSpan - 1;
    }
    const isCellSelected = selectedCellIdx === column.idx;
    cells.push( /*#__PURE__*/jsx(SummaryCell$1, {
      column: column,
      colSpan: colSpan,
      row: row,
      rowIdx: rowIdx,
      isCellSelected: isCellSelected,
      selectCell: selectCell
    }, column.key));
  }
  return /*#__PURE__*/jsx("div", {
    role: "row",
    "aria-rowindex": ariaRowIndex,
    className: clsx(rowClassname, `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`, summaryRowClassname, isTop ? `${topSummaryRowClassname} ${topSummaryRow}` : bottomSummaryRowClassname, selectedCellIdx === -1 && rowSelectedClassname),
    style: {
      ...getRowStyle(gridRowStart),
      '--rdg-summary-row-top': top !== undefined ? `${top}px` : undefined,
      '--rdg-summary-row-bottom': bottom !== undefined ? `${bottom}px` : undefined
    },
    children: cells
  });
}
const SummaryRow$1 = /*#__PURE__*/memo(SummaryRow);

function DataGrid(props, ref) {
  const {
    columns: rawColumns,
    rows,
    topSummaryRows,
    bottomSummaryRows,
    rowKeyGetter,
    onRowsChange,
    rowHeight: rawRowHeight,
    headerRowHeight: rawHeaderRowHeight,
    summaryRowHeight: rawSummaryRowHeight,
    selectedRows,
    onSelectedRowsChange,
    sortColumns,
    onSortColumnsChange,
    defaultColumnOptions,
    onCellClick,
    onCellDoubleClick,
    onCellContextMenu,
    onCellKeyDown,
    onSelectedCellChange,
    onScroll,
    onColumnResize,
    onColumnsReorder,
    onFill,
    onCopy,
    onPaste,
    enableVirtualization: rawEnableVirtualization,
    renderers,
    className,
    style,
    rowClass,
    direction: rawDirection,
    role: rawRole,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-rowcount': rawAriaRowCount,
    'data-testid': testId
  } = props;
  const defaultRenderers = useDefaultRenderers();
  const role = rawRole ?? 'grid';
  const rowHeight = rawRowHeight ?? 35;
  const headerRowHeight = rawHeaderRowHeight ?? (typeof rowHeight === 'number' ? rowHeight : 35);
  const summaryRowHeight = rawSummaryRowHeight ?? (typeof rowHeight === 'number' ? rowHeight : 35);
  const renderRow = renderers?.renderRow ?? defaultRenderers?.renderRow ?? defaultRenderRow;
  const renderCell = renderers?.renderCell ?? defaultRenderers?.renderCell ?? defaultRenderCell;
  const renderSortStatus$1 = renderers?.renderSortStatus ?? defaultRenderers?.renderSortStatus ?? renderSortStatus;
  const renderCheckbox$1 = renderers?.renderCheckbox ?? defaultRenderers?.renderCheckbox ?? renderCheckbox;
  const noRowsFallback = renderers?.noRowsFallback ?? defaultRenderers?.noRowsFallback;
  const enableVirtualization = rawEnableVirtualization ?? true;
  const direction = rawDirection ?? 'ltr';
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [resizedColumnWidths, setResizedColumnWidths] = useState(() => new Map());
  const [measuredColumnWidths, setMeasuredColumnWidths] = useState(() => new Map());
  const [copiedCell, setCopiedCell] = useState(null);
  const [isDragging, setDragging] = useState(false);
  const [draggedOverRowIdx, setOverRowIdx] = useState(undefined);
  const [scrollToPosition, setScrollToPosition] = useState(null);
  const getColumnWidth = useCallback(column => {
    return resizedColumnWidths.get(column.key) ?? measuredColumnWidths.get(column.key) ?? column.width;
  }, [measuredColumnWidths, resizedColumnWidths]);
  const [gridRef, gridWidth, gridHeight] = useGridDimensions();
  const {
    columns,
    colSpanColumns,
    lastFrozenColumnIndex,
    headerRowsCount,
    colOverscanStartIdx,
    colOverscanEndIdx,
    templateColumns,
    layoutCssVars,
    totalFrozenColumnWidth
  } = useCalculatedColumns({
    rawColumns,
    defaultColumnOptions,
    getColumnWidth,
    scrollLeft,
    viewportWidth: gridWidth,
    enableVirtualization
  });
  const topSummaryRowsCount = topSummaryRows?.length ?? 0;
  const bottomSummaryRowsCount = bottomSummaryRows?.length ?? 0;
  const summaryRowsCount = topSummaryRowsCount + bottomSummaryRowsCount;
  const headerAndTopSummaryRowsCount = headerRowsCount + topSummaryRowsCount;
  const groupedColumnHeaderRowsCount = headerRowsCount - 1;
  const minRowIdx = -headerAndTopSummaryRowsCount;
  const mainHeaderRowIdx = minRowIdx + groupedColumnHeaderRowsCount;
  const maxRowIdx = rows.length + bottomSummaryRowsCount - 1;
  const [selectedPosition, setSelectedPosition] = useState(() => ({
    idx: -1,
    rowIdx: minRowIdx - 1,
    mode: 'SELECT'
  }));
  const prevSelectedPosition = useRef(selectedPosition);
  const latestDraggedOverRowIdx = useRef(draggedOverRowIdx);
  const lastSelectedRowIdx = useRef(-1);
  const focusSinkRef = useRef(null);
  const shouldFocusCellRef = useRef(false);
  const isTreeGrid = role === 'treegrid';
  const headerRowsHeight = headerRowsCount * headerRowHeight;
  const clientHeight = gridHeight - headerRowsHeight - summaryRowsCount * summaryRowHeight;
  const isSelectable = selectedRows != null && onSelectedRowsChange != null;
  const isRtl = direction === 'rtl';
  const leftKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
  const rightKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
  const ariaRowCount = rawAriaRowCount ?? headerRowsCount + rows.length + summaryRowsCount;
  const defaultGridComponents = useMemo(() => ({
    renderCheckbox: renderCheckbox$1,
    renderSortStatus: renderSortStatus$1,
    renderCell
  }), [renderCheckbox$1, renderSortStatus$1, renderCell]);
  const allRowsSelected = useMemo(() => {
    const {
      length
    } = rows;
    return length !== 0 && selectedRows != null && rowKeyGetter != null && selectedRows.size >= length && rows.every(row => selectedRows.has(rowKeyGetter(row)));
  }, [rows, selectedRows, rowKeyGetter]);
  const {
    rowOverscanStartIdx,
    rowOverscanEndIdx,
    totalRowHeight,
    gridTemplateRows,
    getRowTop,
    getRowHeight,
    findRowIdx
  } = useViewportRows({
    rows,
    rowHeight,
    clientHeight,
    scrollTop,
    enableVirtualization
  });
  const viewportColumns = useViewportColumns({
    columns,
    colSpanColumns,
    colOverscanStartIdx,
    colOverscanEndIdx,
    lastFrozenColumnIndex,
    rowOverscanStartIdx,
    rowOverscanEndIdx,
    rows,
    topSummaryRows,
    bottomSummaryRows
  });
  const {
    gridTemplateColumns,
    handleColumnResize
  } = useColumnWidths(columns, viewportColumns, templateColumns, gridRef, gridWidth, resizedColumnWidths, measuredColumnWidths, setResizedColumnWidths, setMeasuredColumnWidths, onColumnResize);
  const minColIdx = isTreeGrid ? -1 : 0;
  const maxColIdx = columns.length - 1;
  const selectedCellIsWithinSelectionBounds = isCellWithinSelectionBounds(selectedPosition);
  const selectedCellIsWithinViewportBounds = isCellWithinViewportBounds(selectedPosition);
  const handleColumnResizeLatest = useLatestFunc(handleColumnResize);
  const onColumnsReorderLastest = useLatestFunc(onColumnsReorder);
  const onSortColumnsChangeLatest = useLatestFunc(onSortColumnsChange);
  const onCellClickLatest = useLatestFunc(onCellClick);
  const onCellDoubleClickLatest = useLatestFunc(onCellDoubleClick);
  const onCellContextMenuLatest = useLatestFunc(onCellContextMenu);
  const selectRowLatest = useLatestFunc(selectRow);
  const handleFormatterRowChangeLatest = useLatestFunc(updateRow);
  const selectCellLatest = useLatestFunc(selectCell);
  const selectHeaderCellLatest = useLatestFunc(({
    idx,
    rowIdx
  }) => {
    selectCell({
      rowIdx: minRowIdx + rowIdx - 1,
      idx
    });
  });
  useLayoutEffect(() => {
    if (!selectedCellIsWithinSelectionBounds || isSamePosition(selectedPosition, prevSelectedPosition.current)) {
      prevSelectedPosition.current = selectedPosition;
      return;
    }
    prevSelectedPosition.current = selectedPosition;
    if (selectedPosition.idx === -1) {
      focusSinkRef.current.focus({
        preventScroll: true
      });
      scrollIntoView(focusSinkRef.current);
    }
  });
  useLayoutEffect(() => {
    if (!shouldFocusCellRef.current) return;
    shouldFocusCellRef.current = false;
    focusCellOrCellContent();
  });
  useImperativeHandle(ref, () => ({
    element: gridRef.current,
    selectedCell: selectedPosition,
    scrollToCell({
      idx,
      rowIdx
    }) {
      const scrollToIdx = idx !== undefined && idx > lastFrozenColumnIndex && idx < columns.length ? idx : undefined;
      const scrollToRowIdx = rowIdx !== undefined && isRowIdxWithinViewportBounds(rowIdx) ? rowIdx : undefined;
      if (scrollToIdx !== undefined || scrollToRowIdx !== undefined) {
        setScrollToPosition({
          idx: scrollToIdx,
          rowIdx: scrollToRowIdx
        });
      }
    },
    selectCell
  }));
  const setDraggedOverRowIdx = useCallback(rowIdx => {
    setOverRowIdx(rowIdx);
    latestDraggedOverRowIdx.current = rowIdx;
  }, []);
  function selectRow(args) {
    if (!onSelectedRowsChange) return;
    assertIsValidKeyGetter(rowKeyGetter);
    if (args.type === 'HEADER') {
      const newSelectedRows = new Set(selectedRows);
      for (const row of rows) {
        const rowKey = rowKeyGetter(row);
        if (args.checked) {
          newSelectedRows.add(rowKey);
        } else {
          newSelectedRows.delete(rowKey);
        }
      }
      onSelectedRowsChange(newSelectedRows);
      return;
    }
    const {
      row,
      checked,
      isShiftClick
    } = args;
    const newSelectedRows = new Set(selectedRows);
    const rowKey = rowKeyGetter(row);
    if (checked) {
      newSelectedRows.add(rowKey);
      const previousRowIdx = lastSelectedRowIdx.current;
      const rowIdx = rows.indexOf(row);
      lastSelectedRowIdx.current = rowIdx;
      if (isShiftClick && previousRowIdx !== -1 && previousRowIdx !== rowIdx) {
        const step = sign(rowIdx - previousRowIdx);
        for (let i = previousRowIdx + step; i !== rowIdx; i += step) {
          const row = rows[i];
          newSelectedRows.add(rowKeyGetter(row));
        }
      }
    } else {
      newSelectedRows.delete(rowKey);
      lastSelectedRowIdx.current = -1;
    }
    onSelectedRowsChange(newSelectedRows);
  }
  function handleKeyDown(event) {
    const {
      idx,
      rowIdx,
      mode
    } = selectedPosition;
    if (mode === 'EDIT') return;
    if (onCellKeyDown && isRowIdxWithinViewportBounds(rowIdx)) {
      const row = rows[rowIdx];
      const cellEvent = createCellEvent(event);
      onCellKeyDown({
        mode: 'SELECT',
        row,
        column: columns[idx],
        rowIdx,
        selectCell
      }, cellEvent);
      if (cellEvent.isGridDefaultPrevented()) return;
    }
    if (!(event.target instanceof Element)) return;
    const isCellEvent = event.target.closest('.rdg-cell') !== null;
    const isRowEvent = isTreeGrid && event.target === focusSinkRef.current;
    if (!isCellEvent && !isRowEvent) return;
    const {
      keyCode
    } = event;
    if (selectedCellIsWithinViewportBounds && (onPaste != null || onCopy != null) && isCtrlKeyHeldDown(event)) {
      const cKey = 67;
      const vKey = 86;
      if (keyCode === cKey) {
        if (window.getSelection()?.isCollapsed === false) return;
        handleCopy();
        return;
      }
      if (keyCode === vKey) {
        handlePaste();
        return;
      }
    }
    switch (event.key) {
      case 'Escape':
        setCopiedCell(null);
        return;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Tab':
      case 'Home':
      case 'End':
      case 'PageUp':
      case 'PageDown':
        navigate(event);
        break;
      default:
        handleCellInput(event);
        break;
    }
  }
  function handleScroll(event) {
    const {
      scrollTop,
      scrollLeft
    } = event.currentTarget;
    flushSync(() => {
      setScrollTop(scrollTop);
      setScrollLeft(abs(scrollLeft));
    });
    onScroll?.(event);
  }
  function updateRow(column, rowIdx, row) {
    if (typeof onRowsChange !== 'function') return;
    if (row === rows[rowIdx]) return;
    const updatedRows = [...rows];
    updatedRows[rowIdx] = row;
    onRowsChange(updatedRows, {
      indexes: [rowIdx],
      column
    });
  }
  function commitEditorChanges() {
    if (selectedPosition.mode !== 'EDIT') return;
    updateRow(columns[selectedPosition.idx], selectedPosition.rowIdx, selectedPosition.row);
  }
  function handleCopy() {
    const {
      idx,
      rowIdx
    } = selectedPosition;
    const sourceRow = rows[rowIdx];
    const sourceColumnKey = columns[idx].key;
    setCopiedCell({
      row: sourceRow,
      columnKey: sourceColumnKey
    });
    onCopy?.({
      sourceRow,
      sourceColumnKey
    });
  }
  function handlePaste() {
    if (!onPaste || !onRowsChange || copiedCell === null || !isCellEditable(selectedPosition)) {
      return;
    }
    const {
      idx,
      rowIdx
    } = selectedPosition;
    const targetColumn = columns[idx];
    const targetRow = rows[rowIdx];
    const updatedTargetRow = onPaste({
      sourceRow: copiedCell.row,
      sourceColumnKey: copiedCell.columnKey,
      targetRow,
      targetColumnKey: targetColumn.key
    });
    updateRow(targetColumn, rowIdx, updatedTargetRow);
  }
  function handleCellInput(event) {
    if (!selectedCellIsWithinViewportBounds) return;
    const row = rows[selectedPosition.rowIdx];
    const {
      key,
      shiftKey
    } = event;
    if (isSelectable && shiftKey && key === ' ') {
      assertIsValidKeyGetter(rowKeyGetter);
      const rowKey = rowKeyGetter(row);
      selectRow({
        type: 'ROW',
        row,
        checked: !selectedRows.has(rowKey),
        isShiftClick: false
      });
      event.preventDefault();
      return;
    }
    if (isCellEditable(selectedPosition) && isDefaultCellInput(event)) {
      setSelectedPosition(({
        idx,
        rowIdx
      }) => ({
        idx,
        rowIdx,
        mode: 'EDIT',
        row,
        originalRow: row
      }));
    }
  }
  function isColIdxWithinSelectionBounds(idx) {
    return idx >= minColIdx && idx <= maxColIdx;
  }
  function isRowIdxWithinViewportBounds(rowIdx) {
    return rowIdx >= 0 && rowIdx < rows.length;
  }
  function isCellWithinSelectionBounds({
    idx,
    rowIdx
  }) {
    return rowIdx >= minRowIdx && rowIdx <= maxRowIdx && isColIdxWithinSelectionBounds(idx);
  }
  function isCellWithinEditBounds({
    idx,
    rowIdx
  }) {
    return isRowIdxWithinViewportBounds(rowIdx) && idx >= 0 && idx <= maxColIdx;
  }
  function isCellWithinViewportBounds({
    idx,
    rowIdx
  }) {
    return isRowIdxWithinViewportBounds(rowIdx) && isColIdxWithinSelectionBounds(idx);
  }
  function isCellEditable(position) {
    return isCellWithinEditBounds(position) && isSelectedCellEditable({
      columns,
      rows,
      selectedPosition: position
    });
  }
  function selectCell(position, enableEditor) {
    if (!isCellWithinSelectionBounds(position)) return;
    commitEditorChanges();
    const row = rows[position.rowIdx];
    const samePosition = isSamePosition(selectedPosition, position);
    if (enableEditor && isCellEditable(position)) {
      setSelectedPosition({
        ...position,
        mode: 'EDIT',
        row,
        originalRow: row
      });
    } else if (samePosition) {
      scrollIntoView(getCellToScroll(gridRef.current));
    } else {
      shouldFocusCellRef.current = true;
      setSelectedPosition({
        ...position,
        mode: 'SELECT'
      });
    }
    if (onSelectedCellChange && !samePosition) {
      onSelectedCellChange({
        rowIdx: position.rowIdx,
        row,
        column: columns[position.idx]
      });
    }
  }
  function getNextPosition(key, ctrlKey, shiftKey) {
    const {
      idx,
      rowIdx
    } = selectedPosition;
    const isRowSelected = selectedCellIsWithinSelectionBounds && idx === -1;
    switch (key) {
      case 'ArrowUp':
        return {
          idx,
          rowIdx: rowIdx - 1
        };
      case 'ArrowDown':
        return {
          idx,
          rowIdx: rowIdx + 1
        };
      case leftKey:
        return {
          idx: idx - 1,
          rowIdx
        };
      case rightKey:
        return {
          idx: idx + 1,
          rowIdx
        };
      case 'Tab':
        return {
          idx: idx + (shiftKey ? -1 : 1),
          rowIdx
        };
      case 'Home':
        if (isRowSelected) return {
          idx,
          rowIdx: minRowIdx
        };
        return {
          idx: 0,
          rowIdx: ctrlKey ? minRowIdx : rowIdx
        };
      case 'End':
        if (isRowSelected) return {
          idx,
          rowIdx: maxRowIdx
        };
        return {
          idx: maxColIdx,
          rowIdx: ctrlKey ? maxRowIdx : rowIdx
        };
      case 'PageUp':
        {
          if (selectedPosition.rowIdx === minRowIdx) return selectedPosition;
          const nextRowY = getRowTop(rowIdx) + getRowHeight(rowIdx) - clientHeight;
          return {
            idx,
            rowIdx: nextRowY > 0 ? findRowIdx(nextRowY) : 0
          };
        }
      case 'PageDown':
        {
          if (selectedPosition.rowIdx >= rows.length) return selectedPosition;
          const nextRowY = getRowTop(rowIdx) + clientHeight;
          return {
            idx,
            rowIdx: nextRowY < totalRowHeight ? findRowIdx(nextRowY) : rows.length - 1
          };
        }
      default:
        return selectedPosition;
    }
  }
  function navigate(event) {
    const {
      key,
      shiftKey
    } = event;
    let cellNavigationMode = 'NONE';
    if (key === 'Tab') {
      if (canExitGrid({
        shiftKey,
        maxColIdx,
        minRowIdx,
        maxRowIdx,
        selectedPosition
      })) {
        commitEditorChanges();
        return;
      }
      cellNavigationMode = 'CHANGE_ROW';
    }
    event.preventDefault();
    const ctrlKey = isCtrlKeyHeldDown(event);
    const nextPosition = getNextPosition(key, ctrlKey, shiftKey);
    if (isSamePosition(selectedPosition, nextPosition)) return;
    const nextSelectedCellPosition = getNextSelectedCellPosition({
      moveUp: key === 'ArrowUp',
      moveNext: key === rightKey || key === 'Tab' && !shiftKey,
      columns,
      colSpanColumns,
      rows,
      topSummaryRows,
      bottomSummaryRows,
      minRowIdx,
      mainHeaderRowIdx,
      maxRowIdx,
      lastFrozenColumnIndex,
      cellNavigationMode,
      currentPosition: selectedPosition,
      nextPosition,
      isCellWithinBounds: isCellWithinSelectionBounds
    });
    selectCell(nextSelectedCellPosition);
  }
  function getDraggedOverCellIdx(currentRowIdx) {
    if (draggedOverRowIdx === undefined) return;
    const {
      rowIdx
    } = selectedPosition;
    const isDraggedOver = rowIdx < draggedOverRowIdx ? rowIdx < currentRowIdx && currentRowIdx <= draggedOverRowIdx : rowIdx > currentRowIdx && currentRowIdx >= draggedOverRowIdx;
    return isDraggedOver ? selectedPosition.idx : undefined;
  }
  function focusCellOrCellContent() {
    const cell = getCellToScroll(gridRef.current);
    if (cell === null) return;
    scrollIntoView(cell);
    const elementToFocus = cell.querySelector('[tabindex="0"]') ?? cell;
    elementToFocus.focus({
      preventScroll: true
    });
  }
  function renderDragHandle() {
    if (onFill == null || selectedPosition.mode === 'EDIT' || !isCellWithinViewportBounds(selectedPosition)) {
      return;
    }
    const {
      idx,
      rowIdx
    } = selectedPosition;
    const column = columns[idx];
    if (column.renderEditCell == null || column.editable === false) {
      return;
    }
    const columnWidth = getColumnWidth(column);
    return /*#__PURE__*/jsx(DragHandle, {
      gridRowStart: headerAndTopSummaryRowsCount + rowIdx + 1,
      rows: rows,
      column: column,
      columnWidth: columnWidth,
      maxColIdx: maxColIdx,
      isLastRow: rowIdx === maxRowIdx,
      selectedPosition: selectedPosition,
      isCellEditable: isCellEditable,
      latestDraggedOverRowIdx: latestDraggedOverRowIdx,
      onRowsChange: onRowsChange,
      onClick: focusCellOrCellContent,
      onFill: onFill,
      setDragging: setDragging,
      setDraggedOverRowIdx: setDraggedOverRowIdx
    });
  }
  function getCellEditor(rowIdx) {
    if (selectedPosition.rowIdx !== rowIdx || selectedPosition.mode === 'SELECT') return;
    const {
      idx,
      row
    } = selectedPosition;
    const column = columns[idx];
    const colSpan = getColSpan(column, lastFrozenColumnIndex, {
      type: 'ROW',
      row
    });
    const closeEditor = shouldFocusCell => {
      shouldFocusCellRef.current = shouldFocusCell;
      setSelectedPosition(({
        idx,
        rowIdx
      }) => ({
        idx,
        rowIdx,
        mode: 'SELECT'
      }));
    };
    const onRowChange = (row, commitChanges, shouldFocusCell) => {
      if (commitChanges) {
        flushSync(() => {
          updateRow(column, selectedPosition.rowIdx, row);
          closeEditor(shouldFocusCell);
        });
      } else {
        setSelectedPosition(position => ({
          ...position,
          row
        }));
      }
    };
    if (rows[selectedPosition.rowIdx] !== selectedPosition.originalRow) {
      closeEditor(false);
    }
    return /*#__PURE__*/jsx(EditCell, {
      column: column,
      colSpan: colSpan,
      row: row,
      rowIdx: rowIdx,
      onRowChange: onRowChange,
      closeEditor: closeEditor,
      onKeyDown: onCellKeyDown,
      navigate: navigate
    }, column.key);
  }
  function getRowViewportColumns(rowIdx) {
    const selectedColumn = selectedPosition.idx === -1 ? undefined : columns[selectedPosition.idx];
    if (selectedColumn !== undefined && selectedPosition.rowIdx === rowIdx && !viewportColumns.includes(selectedColumn)) {
      return selectedPosition.idx > colOverscanEndIdx ? [...viewportColumns, selectedColumn] : [...viewportColumns.slice(0, lastFrozenColumnIndex + 1), selectedColumn, ...viewportColumns.slice(lastFrozenColumnIndex + 1)];
    }
    return viewportColumns;
  }
  function getViewportRows() {
    const rowElements = [];
    const {
      idx: selectedIdx,
      rowIdx: selectedRowIdx
    } = selectedPosition;
    const startRowIdx = selectedCellIsWithinViewportBounds && selectedRowIdx < rowOverscanStartIdx ? rowOverscanStartIdx - 1 : rowOverscanStartIdx;
    const endRowIdx = selectedCellIsWithinViewportBounds && selectedRowIdx > rowOverscanEndIdx ? rowOverscanEndIdx + 1 : rowOverscanEndIdx;
    for (let viewportRowIdx = startRowIdx; viewportRowIdx <= endRowIdx; viewportRowIdx++) {
      const isRowOutsideViewport = viewportRowIdx === rowOverscanStartIdx - 1 || viewportRowIdx === rowOverscanEndIdx + 1;
      const rowIdx = isRowOutsideViewport ? selectedRowIdx : viewportRowIdx;
      let rowColumns = viewportColumns;
      const selectedColumn = selectedIdx === -1 ? undefined : columns[selectedIdx];
      if (selectedColumn !== undefined) {
        if (isRowOutsideViewport) {
          rowColumns = [selectedColumn];
        } else {
          rowColumns = getRowViewportColumns(rowIdx);
        }
      }
      const row = rows[rowIdx];
      const gridRowStart = headerAndTopSummaryRowsCount + rowIdx + 1;
      let key = rowIdx;
      let isRowSelected = false;
      if (typeof rowKeyGetter === 'function') {
        key = rowKeyGetter(row);
        isRowSelected = selectedRows?.has(key) ?? false;
      }
      rowElements.push(renderRow(key, {
        'aria-rowindex': headerAndTopSummaryRowsCount + rowIdx + 1,
        'aria-selected': isSelectable ? isRowSelected : undefined,
        rowIdx,
        row,
        viewportColumns: rowColumns,
        isRowSelected,
        onCellClick: onCellClickLatest,
        onCellDoubleClick: onCellDoubleClickLatest,
        onCellContextMenu: onCellContextMenuLatest,
        rowClass,
        gridRowStart,
        height: getRowHeight(rowIdx),
        copiedCellIdx: copiedCell !== null && copiedCell.row === row ? columns.findIndex(c => c.key === copiedCell.columnKey) : undefined,
        selectedCellIdx: selectedRowIdx === rowIdx ? selectedIdx : undefined,
        draggedOverCellIdx: getDraggedOverCellIdx(rowIdx),
        setDraggedOverRowIdx: isDragging ? setDraggedOverRowIdx : undefined,
        lastFrozenColumnIndex,
        onRowChange: handleFormatterRowChangeLatest,
        selectCell: selectCellLatest,
        selectedCellEditor: getCellEditor(rowIdx)
      }));
    }
    return rowElements;
  }
  if (selectedPosition.idx > maxColIdx || selectedPosition.rowIdx > maxRowIdx) {
    setSelectedPosition({
      idx: -1,
      rowIdx: minRowIdx - 1,
      mode: 'SELECT'
    });
    setDraggedOverRowIdx(undefined);
  }
  let templateRows = `repeat(${headerRowsCount}, ${headerRowHeight}px)`;
  if (topSummaryRowsCount > 0) {
    templateRows += ` repeat(${topSummaryRowsCount}, ${summaryRowHeight}px)`;
  }
  if (rows.length > 0) {
    templateRows += gridTemplateRows;
  }
  if (bottomSummaryRowsCount > 0) {
    templateRows += ` repeat(${bottomSummaryRowsCount}, ${summaryRowHeight}px)`;
  }
  const isGroupRowFocused = selectedPosition.idx === -1 && selectedPosition.rowIdx !== minRowIdx - 1;
  return /*#__PURE__*/jsxs("div", {
    role: role,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    "aria-multiselectable": isSelectable ? true : undefined,
    "aria-colcount": columns.length,
    "aria-rowcount": ariaRowCount,
    className: clsx(rootClassname, className, isDragging && viewportDraggingClassname),
    style: {
      ...style,
      scrollPaddingInlineStart: selectedPosition.idx > lastFrozenColumnIndex || scrollToPosition?.idx !== undefined ? `${totalFrozenColumnWidth}px` : undefined,
      scrollPaddingBlock: isRowIdxWithinViewportBounds(selectedPosition.rowIdx) || scrollToPosition?.rowIdx !== undefined ? `${headerRowsHeight + topSummaryRowsCount * summaryRowHeight}px ${bottomSummaryRowsCount * summaryRowHeight}px` : undefined,
      gridTemplateColumns,
      gridTemplateRows: templateRows,
      '--rdg-header-row-height': `${headerRowHeight}px`,
      '--rdg-summary-row-height': `${summaryRowHeight}px`,
      '--rdg-sign': isRtl ? -1 : 1,
      ...layoutCssVars
    },
    dir: direction,
    ref: gridRef,
    onScroll: handleScroll,
    onKeyDown: handleKeyDown,
    "data-testid": testId,
    children: [/*#__PURE__*/jsx(DataGridDefaultRenderersProvider, {
      value: defaultGridComponents,
      children: /*#__PURE__*/jsxs(RowSelectionChangeProvider, {
        value: selectRowLatest,
        children: [/*#__PURE__*/jsxs(RowSelectionProvider, {
          value: allRowsSelected,
          children: [Array.from({
            length: groupedColumnHeaderRowsCount
          }, (_, index) => /*#__PURE__*/jsx(GroupedColumnHeaderRow$1, {
            rowIdx: index + 1,
            level: -groupedColumnHeaderRowsCount + index,
            columns: getRowViewportColumns(minRowIdx + index),
            selectedCellIdx: selectedPosition.rowIdx === minRowIdx + index ? selectedPosition.idx : undefined,
            selectCell: selectHeaderCellLatest
          }, index)), /*#__PURE__*/jsx(HeaderRow$1, {
            rowIdx: headerRowsCount,
            columns: getRowViewportColumns(mainHeaderRowIdx),
            onColumnResize: handleColumnResizeLatest,
            onColumnsReorder: onColumnsReorderLastest,
            sortColumns: sortColumns,
            onSortColumnsChange: onSortColumnsChangeLatest,
            lastFrozenColumnIndex: lastFrozenColumnIndex,
            selectedCellIdx: selectedPosition.rowIdx === mainHeaderRowIdx ? selectedPosition.idx : undefined,
            selectCell: selectHeaderCellLatest,
            shouldFocusGrid: !selectedCellIsWithinSelectionBounds,
            direction: direction
          })]
        }), rows.length === 0 && noRowsFallback ? noRowsFallback : /*#__PURE__*/jsxs(Fragment, {
          children: [topSummaryRows?.map((row, rowIdx) => {
            const gridRowStart = headerRowsCount + 1 + rowIdx;
            const summaryRowIdx = mainHeaderRowIdx + 1 + rowIdx;
            const isSummaryRowSelected = selectedPosition.rowIdx === summaryRowIdx;
            const top = headerRowsHeight + summaryRowHeight * rowIdx;
            return /*#__PURE__*/jsx(SummaryRow$1, {
              "aria-rowindex": gridRowStart,
              rowIdx: summaryRowIdx,
              gridRowStart: gridRowStart,
              row: row,
              top: top,
              bottom: undefined,
              viewportColumns: getRowViewportColumns(summaryRowIdx),
              lastFrozenColumnIndex: lastFrozenColumnIndex,
              selectedCellIdx: isSummaryRowSelected ? selectedPosition.idx : undefined,
              isTop: true,
              selectCell: selectCellLatest
            }, rowIdx);
          }), getViewportRows(), bottomSummaryRows?.map((row, rowIdx) => {
            const gridRowStart = headerAndTopSummaryRowsCount + rows.length + rowIdx + 1;
            const summaryRowIdx = rows.length + rowIdx;
            const isSummaryRowSelected = selectedPosition.rowIdx === summaryRowIdx;
            const top = clientHeight > totalRowHeight ? gridHeight - summaryRowHeight * (bottomSummaryRows.length - rowIdx) : undefined;
            const bottom = top === undefined ? summaryRowHeight * (bottomSummaryRows.length - 1 - rowIdx) : undefined;
            return /*#__PURE__*/jsx(SummaryRow$1, {
              "aria-rowindex": ariaRowCount - bottomSummaryRowsCount + rowIdx + 1,
              rowIdx: summaryRowIdx,
              gridRowStart: gridRowStart,
              row: row,
              top: top,
              bottom: bottom,
              viewportColumns: getRowViewportColumns(summaryRowIdx),
              lastFrozenColumnIndex: lastFrozenColumnIndex,
              selectedCellIdx: isSummaryRowSelected ? selectedPosition.idx : undefined,
              isTop: false,
              selectCell: selectCellLatest
            }, rowIdx);
          })]
        })]
      })
    }), renderDragHandle(), renderMeasuringCells(viewportColumns), isTreeGrid && /*#__PURE__*/jsx("div", {
      ref: focusSinkRef,
      tabIndex: isGroupRowFocused ? 0 : -1,
      className: clsx(focusSinkClassname, isGroupRowFocused && [rowSelected, lastFrozenColumnIndex !== -1 && rowSelectedWithFrozenCell], !isRowIdxWithinViewportBounds(selectedPosition.rowIdx) && focusSinkHeaderAndSummaryClassname),
      style: {
        gridRowStart: selectedPosition.rowIdx + headerAndTopSummaryRowsCount + 1
      }
    }), scrollToPosition !== null && /*#__PURE__*/jsx(ScrollToCell, {
      scrollToPosition: scrollToPosition,
      setScrollToCellPosition: setScrollToPosition,
      gridElement: gridRef.current
    })]
  });
}
function getCellToScroll(gridEl) {
  return gridEl.querySelector(':scope > [role="row"] > [tabindex="0"]');
}
function isSamePosition(p1, p2) {
  return p1.idx === p2.idx && p1.rowIdx === p2.rowIdx;
}
const DataGrid$1 = /*#__PURE__*/forwardRef(DataGrid);

function GroupCell({
  id,
  groupKey,
  childRows,
  isExpanded,
  isCellSelected,
  column,
  row,
  groupColumnIndex,
  isGroupByColumn,
  toggleGroup: toggleGroupWrapper
}) {
  const {
    tabIndex,
    childTabIndex,
    onFocus
  } = useRovingTabIndex(isCellSelected);
  function toggleGroup() {
    toggleGroupWrapper(id);
  }
  const isLevelMatching = isGroupByColumn && groupColumnIndex === column.idx;
  return /*#__PURE__*/jsx("div", {
    role: "gridcell",
    "aria-colindex": column.idx + 1,
    "aria-selected": isCellSelected,
    tabIndex: tabIndex,
    className: getCellClassname(column),
    style: {
      ...getCellStyle(column),
      cursor: isLevelMatching ? 'pointer' : 'default'
    },
    onClick: isLevelMatching ? toggleGroup : undefined,
    onFocus: onFocus,
    children: (!isGroupByColumn || isLevelMatching) && column.renderGroupCell?.({
      groupKey,
      childRows,
      column,
      row,
      isExpanded,
      tabIndex: childTabIndex,
      toggleGroup
    })
  }, column.key);
}
const GroupCell$1 = /*#__PURE__*/memo(GroupCell);

const groupRow = "g1yxluv37-0-0-beta-42";
const groupRowClassname = `rdg-group-row ${groupRow}`;
function GroupedRow({
  className,
  row,
  rowIdx,
  viewportColumns,
  selectedCellIdx,
  isRowSelected,
  selectCell,
  gridRowStart,
  height,
  groupBy,
  toggleGroup,
  ...props
}) {
  const idx = viewportColumns[0].key === SELECT_COLUMN_KEY ? row.level + 1 : row.level;
  function handleSelectGroup() {
    selectCell({
      rowIdx,
      idx: -1
    });
  }
  return /*#__PURE__*/jsx(RowSelectionProvider, {
    value: isRowSelected,
    children: /*#__PURE__*/jsx("div", {
      role: "row",
      "aria-level": row.level + 1,
      "aria-setsize": row.setSize,
      "aria-posinset": row.posInSet + 1,
      "aria-expanded": row.isExpanded,
      className: clsx(rowClassname, groupRowClassname, `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`, className, selectedCellIdx === -1 && rowSelectedClassname),
      onClick: handleSelectGroup,
      style: getRowStyle(gridRowStart, height),
      ...props,
      children: viewportColumns.map(column => /*#__PURE__*/jsx(GroupCell$1, {
        id: row.id,
        groupKey: row.groupKey,
        childRows: row.childRows,
        isExpanded: row.isExpanded,
        isCellSelected: selectedCellIdx === column.idx,
        column: column,
        row: row,
        groupColumnIndex: idx,
        toggleGroup: toggleGroup,
        isGroupByColumn: groupBy.includes(column.key)
      }, column.key))
    })
  });
}
const GroupedRow$1 = /*#__PURE__*/memo(GroupedRow);

function TreeDataGrid({
  columns: rawColumns,
  rows: rawRows,
  rowHeight: rawRowHeight,
  rowKeyGetter: rawRowKeyGetter,
  onCellKeyDown: rawOnCellKeyDown,
  onRowsChange,
  selectedRows: rawSelectedRows,
  onSelectedRowsChange: rawOnSelectedRowsChange,
  renderers,
  groupBy: rawGroupBy,
  rowGrouper,
  expandedGroupIds,
  onExpandedGroupIdsChange,
  ...props
}, ref) {
  const defaultRenderers = useDefaultRenderers();
  const rawRenderRow = renderers?.renderRow ?? defaultRenderers?.renderRow ?? defaultRenderRow;
  const headerAndTopSummaryRowsCount = 1 + (props.topSummaryRows?.length ?? 0);
  const isRtl = props.direction === 'rtl';
  const leftKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
  const rightKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
  const toggleGroupLatest = useLatestFunc(toggleGroup);
  const {
    columns,
    groupBy
  } = useMemo(() => {
    const columns = [...rawColumns].sort(({
      key: aKey
    }, {
      key: bKey
    }) => {
      if (aKey === SELECT_COLUMN_KEY) return -1;
      if (bKey === SELECT_COLUMN_KEY) return 1;
      if (rawGroupBy.includes(aKey)) {
        if (rawGroupBy.includes(bKey)) {
          return rawGroupBy.indexOf(aKey) - rawGroupBy.indexOf(bKey);
        }
        return -1;
      }
      if (rawGroupBy.includes(bKey)) return 1;
      return 0;
    });
    const groupBy = [];
    for (const [index, column] of columns.entries()) {
      if (rawGroupBy.includes(column.key)) {
        groupBy.push(column.key);
        columns[index] = {
          ...column,
          frozen: true,
          renderCell: () => null,
          renderGroupCell: column.renderGroupCell ?? renderToggleGroup,
          editable: false
        };
      }
    }
    return {
      columns,
      groupBy
    };
  }, [rawColumns, rawGroupBy]);
  const [groupedRows, rowsCount] = useMemo(() => {
    if (groupBy.length === 0) return [undefined, rawRows.length];
    const groupRows = (rows, [groupByKey, ...remainingGroupByKeys], startRowIndex) => {
      let groupRowsCount = 0;
      const groups = {};
      for (const [key, childRows] of Object.entries(rowGrouper(rows, groupByKey))) {
        const [childGroups, childRowsCount] = remainingGroupByKeys.length === 0 ? [childRows, childRows.length] : groupRows(childRows, remainingGroupByKeys, startRowIndex + groupRowsCount + 1);
        groups[key] = {
          childRows,
          childGroups,
          startRowIndex: startRowIndex + groupRowsCount
        };
        groupRowsCount += childRowsCount + 1;
      }
      return [groups, groupRowsCount];
    };
    return groupRows(rawRows, groupBy, 0);
  }, [groupBy, rowGrouper, rawRows]);
  const [rows, isGroupRow] = useMemo(() => {
    const allGroupRows = new Set();
    if (!groupedRows) return [rawRows, isGroupRow];
    const flattenedRows = [];
    const expandGroup = (rows, parentId, level) => {
      if (isReadonlyArray(rows)) {
        flattenedRows.push(...rows);
        return;
      }
      Object.keys(rows).forEach((groupKey, posInSet, keys) => {
        const id = parentId !== undefined ? `${parentId}__${groupKey}` : groupKey;
        const isExpanded = expandedGroupIds.has(id);
        const {
          childRows,
          childGroups,
          startRowIndex
        } = rows[groupKey];
        const groupRow = {
          id,
          parentId,
          groupKey,
          isExpanded,
          childRows,
          level,
          posInSet,
          startRowIndex,
          setSize: keys.length
        };
        flattenedRows.push(groupRow);
        allGroupRows.add(groupRow);
        if (isExpanded) {
          expandGroup(childGroups, id, level + 1);
        }
      });
    };
    expandGroup(groupedRows, undefined, 0);
    return [flattenedRows, isGroupRow];
    function isGroupRow(row) {
      return allGroupRows.has(row);
    }
  }, [expandedGroupIds, groupedRows, rawRows]);
  const rowHeight = useMemo(() => {
    if (typeof rawRowHeight === 'function') {
      return row => {
        if (isGroupRow(row)) {
          return rawRowHeight({
            type: 'GROUP',
            row
          });
        }
        return rawRowHeight({
          type: 'ROW',
          row
        });
      };
    }
    return rawRowHeight;
  }, [isGroupRow, rawRowHeight]);
  const getParentRowAndIndex = useCallback(row => {
    const rowIdx = rows.indexOf(row);
    for (let i = rowIdx - 1; i >= 0; i--) {
      const parentRow = rows[i];
      if (isGroupRow(parentRow) && (!isGroupRow(row) || row.parentId === parentRow.id)) {
        return [parentRow, i];
      }
    }
    return undefined;
  }, [isGroupRow, rows]);
  const rowKeyGetter = useCallback(row => {
    if (isGroupRow(row)) {
      return row.id;
    }
    if (typeof rawRowKeyGetter === 'function') {
      return rawRowKeyGetter(row);
    }
    const parentRowAndIndex = getParentRowAndIndex(row);
    if (parentRowAndIndex !== undefined) {
      const {
        startRowIndex,
        childRows
      } = parentRowAndIndex[0];
      const groupIndex = childRows.indexOf(row);
      return startRowIndex + groupIndex + 1;
    }
    return rows.indexOf(row);
  }, [getParentRowAndIndex, isGroupRow, rawRowKeyGetter, rows]);
  const selectedRows = useMemo(() => {
    if (rawSelectedRows == null) return null;
    assertIsValidKeyGetter(rawRowKeyGetter);
    const selectedRows = new Set(rawSelectedRows);
    for (const row of rows) {
      if (isGroupRow(row)) {
        const isGroupRowSelected = row.childRows.every(cr => rawSelectedRows.has(rawRowKeyGetter(cr)));
        if (isGroupRowSelected) {
          selectedRows.add(row.id);
        }
      }
    }
    return selectedRows;
  }, [isGroupRow, rawRowKeyGetter, rawSelectedRows, rows]);
  function onSelectedRowsChange(newSelectedRows) {
    if (!rawOnSelectedRowsChange) return;
    assertIsValidKeyGetter(rawRowKeyGetter);
    const newRawSelectedRows = new Set(rawSelectedRows);
    for (const row of rows) {
      const key = rowKeyGetter(row);
      if (selectedRows?.has(key) && !newSelectedRows.has(key)) {
        if (isGroupRow(row)) {
          for (const cr of row.childRows) {
            newRawSelectedRows.delete(rawRowKeyGetter(cr));
          }
        } else {
          newRawSelectedRows.delete(key);
        }
      } else if (!selectedRows?.has(key) && newSelectedRows.has(key)) {
        if (isGroupRow(row)) {
          for (const cr of row.childRows) {
            newRawSelectedRows.add(rawRowKeyGetter(cr));
          }
        } else {
          newRawSelectedRows.add(key);
        }
      }
    }
    rawOnSelectedRowsChange(newRawSelectedRows);
  }
  function handleKeyDown(args, event) {
    rawOnCellKeyDown?.(args, event);
    if (event.isGridDefaultPrevented()) return;
    if (args.mode === 'EDIT') return;
    const {
      column,
      rowIdx,
      selectCell
    } = args;
    const idx = column?.idx ?? -1;
    const row = rows[rowIdx];
    if (!isGroupRow(row)) return;
    if (idx === -1 && (event.key === leftKey && row.isExpanded || event.key === rightKey && !row.isExpanded)) {
      event.preventDefault();
      event.preventGridDefault();
      toggleGroup(row.id);
    }
    if (idx === -1 && event.key === leftKey && !row.isExpanded && row.level !== 0) {
      const parentRowAndIndex = getParentRowAndIndex(row);
      if (parentRowAndIndex !== undefined) {
        event.preventGridDefault();
        selectCell({
          idx,
          rowIdx: parentRowAndIndex[1]
        });
      }
    }
    if (isCtrlKeyHeldDown(event) && (event.keyCode === 67 || event.keyCode === 86)) {
      event.preventGridDefault();
    }
  }
  function handleRowsChange(updatedRows, {
    indexes,
    column
  }) {
    if (!onRowsChange) return;
    const updatedRawRows = [...rawRows];
    const rawIndexes = [];
    for (const index of indexes) {
      const rawIndex = rawRows.indexOf(rows[index]);
      updatedRawRows[rawIndex] = updatedRows[index];
      rawIndexes.push(rawIndex);
    }
    onRowsChange(updatedRawRows, {
      indexes: rawIndexes,
      column
    });
  }
  function toggleGroup(groupId) {
    const newExpandedGroupIds = new Set(expandedGroupIds);
    if (newExpandedGroupIds.has(groupId)) {
      newExpandedGroupIds.delete(groupId);
    } else {
      newExpandedGroupIds.add(groupId);
    }
    onExpandedGroupIdsChange(newExpandedGroupIds);
  }
  function renderRow(key, {
    row,
    rowClass,
    onCellClick,
    onCellDoubleClick,
    onCellContextMenu,
    onRowChange,
    lastFrozenColumnIndex,
    copiedCellIdx,
    draggedOverCellIdx,
    setDraggedOverRowIdx,
    selectedCellEditor,
    ...rowProps
  }) {
    if (isGroupRow(row)) {
      const {
        startRowIndex
      } = row;
      return /*#__PURE__*/jsx(GroupedRow$1, {
        ...rowProps,
        "aria-rowindex": headerAndTopSummaryRowsCount + startRowIndex + 1,
        row: row,
        groupBy: groupBy,
        toggleGroup: toggleGroupLatest
      }, key);
    }
    let ariaRowIndex = rowProps['aria-rowindex'];
    const parentRowAndIndex = getParentRowAndIndex(row);
    if (parentRowAndIndex !== undefined) {
      const {
        startRowIndex,
        childRows
      } = parentRowAndIndex[0];
      const groupIndex = childRows.indexOf(row);
      ariaRowIndex = startRowIndex + headerAndTopSummaryRowsCount + groupIndex + 2;
    }
    return rawRenderRow(key, {
      ...rowProps,
      'aria-rowindex': ariaRowIndex,
      row,
      rowClass,
      onCellClick,
      onCellDoubleClick,
      onCellContextMenu,
      onRowChange,
      lastFrozenColumnIndex,
      copiedCellIdx,
      draggedOverCellIdx,
      setDraggedOverRowIdx,
      selectedCellEditor
    });
  }
  return /*#__PURE__*/jsx(DataGrid$1, {
    ...props,
    role: "treegrid",
    "aria-rowcount": rowsCount + 1 + (props.topSummaryRows?.length ?? 0) + (props.bottomSummaryRows?.length ?? 0),
    ref: ref,
    columns: columns,
    rows: rows,
    rowHeight: rowHeight,
    rowKeyGetter: rowKeyGetter,
    onRowsChange: handleRowsChange,
    selectedRows: selectedRows,
    onSelectedRowsChange: onSelectedRowsChange,
    onCellKeyDown: handleKeyDown,
    renderers: {
      ...renderers,
      renderRow
    }
  });
}
function isReadonlyArray(arr) {
  return Array.isArray(arr);
}
const TreeDataGrid$1 = /*#__PURE__*/forwardRef(TreeDataGrid);

const textEditorInternalClassname = "t7vyx3i7-0-0-beta-42";
const textEditorClassname = `rdg-text-editor ${textEditorInternalClassname}`;
function autoFocusAndSelect(input) {
  input?.focus();
  input?.select();
}
function textEditor({
  row,
  column,
  onRowChange,
  onClose
}) {
  return /*#__PURE__*/jsx("input", {
    className: textEditorClassname,
    ref: autoFocusAndSelect,
    value: row[column.key],
    onChange: event => onRowChange({
      ...row,
      [column.key]: event.target.value
    }),
    onBlur: () => onClose(true, false)
  });
}

export { CellComponent$1 as Cell, DataGridDefaultRenderersProvider, RowComponent$1 as Row, SELECT_COLUMN_KEY, SelectCellFormatter, SelectColumn, ToggleGroup, TreeDataGrid$1 as TreeDataGrid, DataGrid$1 as default, renderCheckbox, renderHeaderCell, renderSortIcon, renderSortPriority, renderToggleGroup, renderValue, textEditor, useRowSelection };
//# sourceMappingURL=bundle.js.map
