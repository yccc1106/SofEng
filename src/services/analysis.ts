
import type { AnalysisData } from '@/types/analysis';

export async function fakeChartData(): Promise<AnalysisData> {
  try {
    const response = await fetch('/api/fake_analysis_chart_data');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const res = await response.json();
    return res.data;
  } catch (error) {
    console.error("Failed to fetch chart data", error);
    return {} as AnalysisData;
  }
}
