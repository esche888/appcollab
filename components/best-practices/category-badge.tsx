interface CategoryBadgeProps {
  category: string
}

const categoryColors: Record<string, string> = {
  architecture: 'bg-violet-100 text-violet-700',
  development: 'bg-indigo-100 text-indigo-700',
  testing: 'bg-emerald-100 text-emerald-700',
  deployment: 'bg-orange-100 text-orange-700',
  security: 'bg-red-100 text-red-700',
  ux_design: 'bg-rose-100 text-rose-700',
  performance: 'bg-amber-100 text-amber-700',
  documentation: 'bg-sky-100 text-sky-700',
  collaboration: 'bg-teal-100 text-teal-700',
  project_management: 'bg-cyan-100 text-cyan-700',
  other: 'bg-slate-100 text-slate-700',
}

const categoryLabels: Record<string, string> = {
  architecture: 'Architecture',
  development: 'Development',
  testing: 'Testing & QA',
  deployment: 'Deployment & CI/CD',
  security: 'Security',
  ux_design: 'UX/UI Design',
  performance: 'Performance',
  documentation: 'Documentation',
  collaboration: 'Collaboration',
  project_management: 'Project Management',
  other: 'Other',
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const colorClass = categoryColors[category] || categoryColors.other
  const label = categoryLabels[category] || category

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
