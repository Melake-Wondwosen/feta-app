/* Date helpers for the manager dashboard's period picker.
   All dates are handled as local YYYY-MM-DD strings, matching how the
   backend compares them. */

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d, n) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

/* Monday-start week containing the given date. */
function startOfWeek(d) {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7; // Mon = 0
  return addDays(copy, -day);
}

/* Calendar weeks of the current month, split Mon–Sun. "Week 1" is the
   week containing the 1st, clipped to the month's own boundaries so a
   week never reports days from the month before or after. */
export function weeksOfMonth(ref = new Date()) {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const weeks = [];
  let cursor = startOfWeek(firstOfMonth);
  let n = 1;

  while (cursor <= lastOfMonth) {
    const weekEnd = addDays(cursor, 6);
    const from = cursor < firstOfMonth ? firstOfMonth : cursor;
    const to = weekEnd > lastOfMonth ? lastOfMonth : weekEnd;

    weeks.push({
      key: `week${n}`,
      label: `Week ${n}`,
      from: toISODate(from),
      to: toISODate(to),
    });

    cursor = addDays(cursor, 7);
    n += 1;
  }

  return weeks;
}

export function buildPresets(ref = new Date()) {
  const today = toISODate(ref);
  const yesterday = toISODate(addDays(ref, -1));

  const thisWeekStart = startOfWeek(ref);
  const lastWeekStart = addDays(thisWeekStart, -7);
  const lastWeekEnd = addDays(thisWeekStart, -1);

  const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1);

  return [
    { key: "today", label: "Today", from: today, to: today },
    { key: "yesterday", label: "Yesterday", from: yesterday, to: yesterday },
    {
      key: "thisWeek",
      label: "This week",
      from: toISODate(thisWeekStart),
      to: today,
    },
    {
      key: "lastWeek",
      label: "Last week",
      from: toISODate(lastWeekStart),
      to: toISODate(lastWeekEnd),
    },
    {
      key: "thisMonth",
      label: "This month",
      from: toISODate(monthStart),
      to: today,
    },
    { key: "all", label: "All time", from: "", to: "" },
  ];
}

export function describeRange(from, to) {
  if (!from && !to) return "All time";

  const fmt = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
  };

  if (from === to) return fmt(from);
  if (from && to) return `${fmt(from)} – ${fmt(to)}`;
  return from ? `Since ${fmt(from)}` : `Up to ${fmt(to)}`;
}
