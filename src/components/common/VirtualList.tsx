import React from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height?: number | string;
  width?: string;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
}

/**
 * Generic Virtual Scrolling List Component
 *
 * Only renders visible items for optimal performance with large lists
 *
 * @example
 * ```tsx
 * <VirtualList
 *   items={customers}
 *   itemHeight={80}
 *   renderItem={(customer, index, style) => (
 *     <div style={style} key={customer.id}>
 *       {customer.name}
 *     </div>
 *   )}
 * />
 * ```
 */
function VirtualList<T>({
  items,
  itemHeight,
  height = '100%',
  width = '100%',
  renderItem,
  className = '',
}: VirtualListProps<T>) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    return renderItem(items[index], index, style);
  };

  return (
    <div className={className}>
      <List
        height={typeof height === 'string' ? window.innerHeight - 200 : height}
        itemCount={items.length}
        itemSize={itemHeight}
        width={width}
      >
        {Row}
      </List>
    </div>
  );
}

export default VirtualList;
