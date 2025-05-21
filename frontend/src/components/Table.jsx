import React from "react";

const Table = ({
  data,
  columns,
  actions,
  expandableContent,
  isLoading = false,
}) => {
  const [expandedRows, setExpandedRows] = React.useState([]);

  const toggleRow = (userId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No user data available</p>
      </div>
    );
  }

  return (
    <div className="bg-background/70 shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-secondary">
        <thead className="bg-primary/65">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase tracking-wider">
              S.No
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-sm font-medium text-text uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary/45">
          {data.map((item, index) =>{
            const itemId = item._id || `row-${index}-${JSON.stringify(item)}`;
            return (
            <React.Fragment key={`fragment-${itemId}`}>
              <tr
                key={`row-${itemId}`}
                className={expandableContent ? "cursor-pointer" : ""}
                onClick={
                  expandableContent ? () => toggleRow(itemId) : undefined
                }
              >
                <td className="px-6 py-4 whitespace-nowrap text-text/75">
                  {index + 1}
                </td>
                {columns.map((column) => (
                  <td
                    key={`${itemId}-${column.key}`}
                    className="px-6 py-4 whitespace-nowrap text-text/75"
                  >
                    {column.render
                      ? column.render(item[column.key], item)
                      : item[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-text/65">
                    {actions(item)}
                  </td>
                )}
              </tr>
              {expandableContent && expandedRows[itemId] && (
                <tr className="bg-secondary/5">
                  <td
                    colSpan={columns.length + 1}
                    // colSpan={columns.length + (actions ? 1 : 0)}
                  >
                    {expandableContent(item)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          )})}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
