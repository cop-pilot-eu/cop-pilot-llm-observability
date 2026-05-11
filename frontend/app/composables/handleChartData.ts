import { groupBy } from "ramda";

const getGroupKey = (timestamp: string, type: GroupingType): string => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);

  // Find the Monday of that week
  if (type === "week") {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday (0)
    date.setDate(diff);
  }

  // Sets to the 1st of the month
  if (type === "month") {
    date.setDate(1);
  }

  return date.toISOString();
};

const formatPeriod = (dateStr: string, type: GroupingType): string => {
  const date = new Date(dateStr);

  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();

  if (type === "month") {
    // Returns date like "February 2026"
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(date);
  }

  if (type === "week") {
    // Start date (Monday)
    const startDate = new Date(date);
    const sd = String(startDate.getDate()).padStart(2, "0");
    const sm = String(startDate.getMonth() + 1).padStart(2, "0");
    const sy = startDate.getFullYear();

    return `${sd}-${sm}-${sy}`;
  }

  // day default: dd-mm-yyyy
  return `${d}-${m}-${y}`;
};

export const groupChartData = (data: ChartDataObj[], type: GroupingType) => {
  const grouped = groupBy(
    (item: ChartDataObj) => getGroupKey(item.timestamp, type),
    data,
  );

  return Object.entries(grouped)
    .sort(
      ([dateA], [dateB]) =>
        new Date(dateA).getTime() - new Date(dateB).getTime(),
    )
    .map(([dateKey, items]) => {
      const successCount = items?.filter((i) => i.success).length || 0;
      const failCount = items?.filter((i) => !i.success).length || 0;

      return {
        period: formatPeriod(dateKey, type),
        rawDate: dateKey,
        success: successCount,
        failure: failCount,
      };
    });
};
