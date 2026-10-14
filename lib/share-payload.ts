import { emptyChartPrefs, type ChartPrefs } from "./chart-prefs";
import { computeItemStats } from "./item-stats";
import { buildStatsPdf, uploadPdf } from "./pdf-report";
import { publicUrl } from "./public-origin";

export async function shareBundle(opts: {
  path: string;
  title: string;
  subtitle: string;
  teacherId?: string;
  schoolId?: string;
  extra?: Record<string, unknown>;
  chartPrefs?: ChartPrefs;
}) {
  const stats = await computeItemStats({ teacherId: opts.teacherId, schoolId: opts.schoolId });
  const pdf = await buildStatsPdf(
    opts.title,
    opts.subtitle,
    stats.carpetas,
    stats.acompanamiento,
    opts.chartPrefs ?? emptyChartPrefs()
  );
  const pdfUrl = await uploadPdf(opts.path.replace(/\W/g, "-"), pdf);
  return {
    path: opts.path,
    pdfUrl,
    reportUrl: publicUrl(opts.path),
    pdfName: opts.extra?.pdfName,
    ...opts.extra,
  };
}
