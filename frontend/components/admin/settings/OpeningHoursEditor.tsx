"use client";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Controls";
import { Input } from "@/components/ui/Input";
import { adminText } from "@/messages/admin";
import type { OpeningHour } from "@/types/admin";

interface OpeningHoursEditorProps {
  value: OpeningHour[];
  onChange: (value: OpeningHour[]) => void;
  error?: string;
}

export function OpeningHoursEditor({ value, onChange, error }: OpeningHoursEditorProps) {
  const update = (index: number, patch: Partial<OpeningHour>) =>
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{adminText.settings.closesNextDay}</p>
      {value.length === 0 && <p className="text-muted">{adminText.settings.noHours}</p>}
      {value.map((row, index) => (
        <div key={index} className="grid items-end gap-3 rounded-control border border-ink/10 p-3 sm:grid-cols-4">
          <Select id={`hours-day-${index}`} label={adminText.settings.day} value={String(row.day)} onChange={(event) => update(index, { day: Number(event.target.value) })}>
            {adminText.settings.days.map((name, day) => (
              <option key={name} value={day}>
                {name}
              </option>
            ))}
          </Select>
          <Input id={`hours-open-${index}`} label={adminText.settings.opens} type="time" value={row.open} onChange={(event) => update(index, { open: event.target.value })} />
          <Input id={`hours-close-${index}`} label={adminText.settings.closes} type="time" value={row.close} onChange={(event) => update(index, { close: event.target.value })} />
          <Button variant="ghost" onClick={() => onChange(value.filter((_, i) => i !== index))}>
            {adminText.settings.removeHours}
            <span className="sr-only"> {adminText.settings.days[row.day]}</span>
          </Button>
        </div>
      ))}
      {error && (
        <p role="alert" className="font-semibold text-tomato-dark">
          {error}
        </p>
      )}
      <Button variant="secondary" disabled={value.length >= 28} onClick={() => onChange([...value, { day: 1, open: "10:00", close: "22:00" }])}>
        {adminText.settings.addHours}
      </Button>
    </div>
  );
}