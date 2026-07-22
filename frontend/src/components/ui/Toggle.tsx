import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export default function Toggle({ checked, onChange, label }: ToggleProps) {
  const button = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-[46px] h-[27px] rounded-full transition-colors shrink-0",
        checked ? "bg-brand-500" : "bg-gray-200"
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] w-[21px] h-[21px] rounded-full bg-white shadow transition-all",
          checked ? "left-[22px]" : "left-[3px]"
        )}
      />
    </button>
  );

  if (!label) return button;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      {button}
    </div>
  );
}
