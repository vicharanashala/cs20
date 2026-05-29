export default function MiniChart({ data, color = '#6366f1', height = 40 }) {
  if (!data || data.length === 0) {
    return <div style={{ height }} className="w-full" />;
  }

  const counts = data.map(d => d.count);
  const max = Math.max(...counts, 1);
  const width = 120;
  const barWidth = Math.max(4, Math.floor((width - (data.length - 1) * 2) / data.length));
  const totalWidth = data.length * (barWidth + 2) - 2;

  return (
    <svg
      width={totalWidth}
      height={height}
      viewBox={`0 0 ${totalWidth} ${height}`}
      className="block"
    >
      {data.map((d, i) => {
        const barHeight = Math.max(2, Math.round((d.count / max) * (height - 4)));
        const x = i * (barWidth + 2);
        const y = height - barHeight - 2;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={2}
            fill={color}
            opacity={0.7 + (d.count / max) * 0.3}
          />
        );
      })}
    </svg>
  );
}
