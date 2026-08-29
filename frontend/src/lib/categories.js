export const CATEGORIES = [
  "Academics & Notes",
  "Professors & Courses",
  "Placements & Internships",
  "Campus Life",
  "General",
];

const COLOR_VARS = {
  "Academics & Notes": "--cat-academics",
  "Professors & Courses": "--cat-professors",
  "Placements & Internships": "--cat-placements",
  "Campus Life": "--cat-campus",
  General: "--cat-general",
};

// returns a CSS var() reference for the category's colour, with a sane fallback
export function categoryColor(category) {
  const varName = COLOR_VARS[category] || COLOR_VARS.General;
  return `var(${varName})`;
}

export function initials(name) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}
