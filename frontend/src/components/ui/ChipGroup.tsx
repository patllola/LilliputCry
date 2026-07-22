import { cn } from "@/lib/utils";

interface ChipOption {
  label: string;
  value: string;
}

interface ChipGroupProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function ChipGroup({ options, value, onChange }: ChipGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold border transition-colors",
            value === opt.value
              ? "bg-brand-500 border-brand-500 text-white"
              : "bg-white border-gray-200 text-gray-600 hover:border-brand-300"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
