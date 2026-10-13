"use client";

export function YesNo({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (v: "si" | "no") => void;
}) {
  return (
    <div className="flex gap-3">
      {(["si", "no"] as const).map((opt) => (
        <label key={opt} className="flex cursor-pointer items-center gap-1 text-sm">
          <input
            type="radio"
            name={name}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="accent-[#6a0938]"
          />
          {opt === "si" ? "Sí" : "No"}
        </label>
      ))}
    </div>
  );
}
