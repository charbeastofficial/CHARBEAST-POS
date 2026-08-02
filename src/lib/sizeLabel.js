// Maps free-text size names (admins can type anything -- "Small", "Large
// Pizza", "Small-9inch", etc.) down to a short badge label for compact pill
// buttons. Matches the size keyword anywhere in the name (word-bounded), not
// just an exact full match, since most real names aren't just "Small" on
// its own. Order matters: "extra large"/"xl" must be checked before "large"
// so "Extra Large Pizza" doesn't get caught by the plain "large" rule first.
const RULES = [
  [/\bxxl\b|\bextra\s*extra\s*large\b/i, "XXL"],
  [/\bxl\b|\bx-?large\b|\bextra\s*large\b/i, "XL"],
  [/\bxs\b|\bextra\s*small\b/i, "XS"],
  [/\blarge\b|\blg\b/i, "L"],
  [/\bmedium\b|\bmed\b/i, "M"],
  [/\bsmall\b|\bsm\b/i, "S"],
  [/\bregular\b|\breg\b/i, "R"],
  [/\bpersonal\b/i, "P"],
  [/\bfamily\b/i, "F"],
  [/\bhalf\b/i, "H"],
];

export function sizeAbbreviation(name) {
  if (!name) return "";
  const trimmed = name.trim();
  for (const [pattern, abbr] of RULES) {
    if (pattern.test(trimmed)) return abbr;
  }
  // No known keyword found (e.g. "9 inch") -- fall back to initials.
  const words = trimmed.replace(/[()]/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return trimmed.slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}
