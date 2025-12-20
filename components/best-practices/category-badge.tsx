interface CategoryBadgeProps {
  category: string
}

const categoryColors: Record<string, string> = {
  architecture: 'bg-purple-100 text-purple-800',
  development: 'bg-blue-100 text-blue-800',
  testing: 'bg-green-100 text-green-800',
  deployment: 'bg-orange-100 text-orange-800',
  security: 'bg-red-100 text-red-800',
  ux_design: 'bg-pink-100 text-pink-800',
  performance: 'bg-yellow-100 text-yellow-800',
  documentation: 'bg-indigo-100 text-indigo-800',
  collaboration: 'bg-teal-100 text-teal-800',
  project_management: 'bg-cyan-100 text-cyan-800',
  other: 'bg-gray-100 text-gray-800',
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
