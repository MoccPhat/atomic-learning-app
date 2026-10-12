import React from 'react';
import { DimensionScore, calculateRadarSvgPoints } from '../../lib/mock-exam-service';
import { AlertTriangle, Award, CheckCircle } from 'lucide-react';

interface WeaknessRadarChartProps {
  dimensions: DimensionScore[];
  weakestDimension: string | null;
}

export const WeaknessRadarChart: React.FC<WeaknessRadarChartProps> = ({
  dimensions,
  weakestDimension,
}) => {
  const size = 320;
  const center = size / 2;
  const radius = 105;

  // Lưới đa giác đồng tâm các mức 20%, 40%, 60%, 80%, 100%
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const count = dimensions.length;
  const angleStep = (Math.PI * 2) / count;

  const { polygonPoints, axisPoints } = calculateRadarSvgPoints(dimensions, center, radius);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          Radar Năng Lực & Phân Tích Điểm Yếu
        </h4>
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Thang đo 5 chiều</span>
      </div>

      {/* VÙNG ĐỒ THỊ RADAR SVG */}
      <div className="relative flex justify-center items-center py-2">
        <svg width={size} height={size} className="overflow-visible select-none">
          {/* Lưới đa giác nền (Concentric Web) */}
          {levels.map((lvl) => {
            const gridPts = dimensions.map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const r = radius * lvl;
              const x = center + r * Math.cos(angle);
              const y = center + r * Math.sin(angle);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(' ');

            return (
              <polygon
                key={lvl}
                points={gridPts}
                fill="none"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth={lvl === 1.0 ? '1.5' : '1'}
                strokeDasharray={lvl === 1.0 ? '' : '3 3'}
              />
            );
          })}

          {/* Các nan hoa trục (Axes) */}
          {dimensions.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="1"
              />
            );
          })}

          {/* Vùng điểm số của người thi (Polygon fill & stroke) */}
          <polygon
            points={polygonPoints}
            className="fill-brand-500/25 dark:fill-brand-500/35 stroke-brand-600 dark:stroke-brand-400"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Điểm nút tròn trên các đỉnh */}
          {polygonPoints.split(' ').map((pt, idx) => {
            const [px, py] = pt.split(',').map(Number);
            const dim = dimensions[idx];
            const isWeak = dim && dim.percentage < 60;
            return (
              <circle
                key={idx}
                cx={px}
                cy={py}
                r={isWeak ? 4.5 : 4}
                className={isWeak ? 'fill-rose-500 stroke-white dark:stroke-slate-900 stroke-2' : 'fill-brand-600 dark:fill-brand-400 stroke-white dark:stroke-slate-900 stroke-2'}
              />
            );
          })}

          {/* Nhãn văn bản xung quanh các đỉnh */}
          {axisPoints.map((ap, idx) => {
            const isWeak = ap.pct < 60;
            // Căn chỉnh chữ theo vị trí góc
            const textAnchor = ap.x > center + 10 ? 'start' : ap.x < center - 10 ? 'end' : 'middle';
            return (
              <g key={idx}>
                <text
                  x={ap.x}
                  y={ap.y - 3}
                  textAnchor={textAnchor}
                  className={`text-[10px] font-bold ${
                    isWeak ? 'fill-rose-600 dark:fill-rose-400' : 'fill-slate-700 dark:fill-slate-300'
                  }`}
                >
                  {ap.label}
                </text>
                <text
                  x={ap.x}
                  y={ap.y + 9}
                  textAnchor={textAnchor}
                  className={`text-[9px] font-mono font-bold ${
                    isWeak ? 'fill-rose-500 dark:fill-rose-400' : 'fill-brand-600 dark:fill-brand-400'
                  }`}
                >
                  {ap.pct}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* CẢNH BÁO LỖ HỔNG HOẶC KHEN NGỢI */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        {weakestDimension ? (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200">
              <span className="font-bold">Lỗ hổng kiến thức lớn nhất:</span> Khía cạnh{' '}
              <span className="font-black underline">{weakestDimension}</span> đạt kết quả thấp nhất.
              Hãy tập trung đọc lại lý thuyết và làm thêm bài tập phần này!
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 font-medium">
              <span className="font-bold">Phong độ rất đồng đều!</span> Bạn nắm vững toàn diện cả 5 chiều năng lực cốt lõi.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
