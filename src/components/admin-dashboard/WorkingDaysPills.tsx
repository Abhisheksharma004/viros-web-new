const WEEKDAYS = [
    { value: 1, label: "Mon", full: "Monday" },
    { value: 2, label: "Tue", full: "Tuesday" },
    { value: 3, label: "Wed", full: "Wednesday" },
    { value: 4, label: "Thu", full: "Thursday" },
    { value: 5, label: "Fri", full: "Friday" },
    { value: 6, label: "Sat", full: "Saturday" },
    { value: 0, label: "Sun", full: "Sunday" },
] as const;

export default function WorkingDaysPills({ days }: { days: number[] }) {
    return (
        <div className="flex flex-wrap gap-1">
            {WEEKDAYS.map((d) => {
                const on = days.includes(d.value);
                return (
                    <span
                        key={d.value}
                        className={`inline-flex h-7 w-8 items-center justify-center rounded-md text-[10px] font-bold ${
                            on ? "bg-[#0a2a5e] text-white" : "bg-gray-100 text-gray-400"
                        }`}
                        title={d.full}
                    >
                        {d.label}
                    </span>
                );
            })}
        </div>
    );
}
