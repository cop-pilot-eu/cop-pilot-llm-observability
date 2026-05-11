declare global {
  type ChartDataObj = {
    timestamp: string;
    success: boolean;
  };

  type dataFormatted = {
    period: string;
    rawDate: Date;
    success: number;
    failure: number;
  };

  type GroupingType = "day" | "week" | "month";
}
