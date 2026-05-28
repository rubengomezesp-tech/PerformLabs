import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

export type Column<Row> = {
  key: string;
  header: ReactNode;
  /** Cell renderer. Receives the row and its index. */
  cell: (row: Row, index: number) => ReactNode;
};

export type TableProps<Row> = Omit<ComponentProps<"table">, "className" | "children"> & {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  className?: string;
};

/** Canonical data-table primitive built on the .table styles in globals.css. */
export function Table<Row>({ columns, rows, rowKey, className, ...rest }: TableProps<Row>) {
  return (
    <table className={cx("table", className)} {...rest}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={rowKey(row, index)}>
            {columns.map((col) => (
              <td key={col.key}>{col.cell(row, index)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
