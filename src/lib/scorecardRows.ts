export interface ScorecardRow {
  id: string; name: string; code: string; credits: string; totalMarks: string; gradePoint: string;
}
const key = (value: string) => value.trim().toLowerCase();
/** A scorecard owns its saved rows independently of the attendance Subjects list. */
export function mergeScorecardRows(saved: ScorecardRow[], courses: { id: string; name: string; code: string; credits: number }[]): ScorecardRow[] {
  const rows = saved.map(row => ({ ...row }));
  for (const course of courses) {
    const existing = rows.find(row => row.id === course.id || (row.name && key(row.name) === key(course.name)) || (row.code && course.code && key(row.code) === key(course.code)));
    if (!existing) rows.push({ id: course.id, name: course.name, code: course.code || '', credits: String(course.credits ?? 0), totalMarks: '', gradePoint: '' });
  }
  return rows;
}
export function reconcileScorecardEdits(incoming: ScorecardRow[], local: ScorecardRow[], dirty: Map<string, Set<keyof ScorecardRow>>): ScorecardRow[] {
  return incoming.map(row => {
    const previous = local.find(item => item.id === row.id);
    if (!previous) return row;
    const next = { ...row };
    for (const field of dirty.get(row.id) ?? []) next[field] = previous[field];
    return next;
  });
}
