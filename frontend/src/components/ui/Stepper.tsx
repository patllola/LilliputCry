import { cn } from "@/lib/utils";

interface StepperProps {
  value: string | number;
  unit?: string;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementDisabled?: boolean;
  incrementDisabled?: boolean;
  size?: "md" | "lg";
}

export default function Stepper({
  value,
  unit,
  onDecrement,
  onIncrement,
  decrementDisabled,
  incrementDisabled,
  size = "lg",
}: StepperProps) {
  const btnSize = size === "lg" ? "w-12 h-12 text-2xl" : "w-10 h-10 text-xl";
  return (
    <div className="flex items-center justify-between bg-brand-50 rounded-2xl px-3 py-2.5">
      <button
        type="button"
        onClick={onDecrement}
        disabled={decrementDisabled}
        className={cn(
          "rounded-2xl bg-white border border-gray-200 font-bold text-gray-700 flex items-center justify-center hover:border-brand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors",
          btnSize
        )}
        aria-label="Decrease"
      >
        −
      </button>
      <div className="flex items-baseline gap-1">
        <span className={cn("font-extrabold text-gray-900", size === "lg" ? "text-3xl" : "text-xl")}>
          {value}
        </span>
        {unit && <span className="text-sm font-semibold text-gray-500">{unit}</span>}
      </div>
      <button
        type="button"
        onClick={onIncrement}
        disabled={incrementDisabled}
        className={cn(
          "rounded-2xl bg-brand-500 text-white font-bold flex items-center justify-center hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors",
          btnSize
        )}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
