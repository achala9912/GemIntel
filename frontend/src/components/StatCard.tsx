interface StatCardProps {
  label: string;
  value: React.ReactNode;
  description: string;
  delayClass?: string;
  valueColor?: string;
}

export default function StatCard({ 
  label, 
  value, 
  description, 
  delayClass = '',
  valueColor
}: StatCardProps) {
  return (
    <div className={`p-6 text-center flex flex-col gap-2 glass-panel ${delayClass}`}>
      <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{label}</span>
      <span 
        className="text-3xl font-extrabold font-sans text-violet-400 my-1" 
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
      <span className="text-xs text-gray-300 font-medium leading-relaxed">{description}</span>
    </div>
  );
}
