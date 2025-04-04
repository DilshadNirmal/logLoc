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
    <div className="bg-secondary/10 shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-secondary">
        <thead className="bg-secondary">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary">
          {data.map((item) => (
            <React.Fragment key={item._id}>
              <tr
                className={expandableContent ? "cursor-pointer" : ""}
                onClick={
                  expandableContent ? () => toggleRow(item._id) : undefined
                }
              >
                {columns.map((column) => (
                  <td
                    key={`${item._id}-${column.key}`}
                    className="px-6 py-4 whitespace-nowrap text-text"
                  >
                    {column.render
                      ? column.render(item[column.key], item)
                      : item[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-text">
                    {actions(item)}
                  </td>
                )}
              </tr>
              {expandableContent && expandedRows[item._id] && (
                <tr className="bg-secondary/5">
                  <td colSpan={columns.length + (actions ? 1 : 0)}>
                    {expandableContent(item)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
