import React from 'react'

const LEVELS = [
  {
    level: 'K1',
    label: 'Remembering (MCQ Spec)',
    description: 'Generates 1-mark Multiple Choice Questions (MCQ) with 4 distinct options (A, B, C, D).',
  },
  {
    level: 'K2',
    label: 'Understanding',
    description: 'Definitions and basic explanations.',
  },
  {
    level: 'K3',
    label: 'Applying',
    description: 'Comparison and differentiation type questions.',
  },
  {
    level: 'K4',
    label: 'Analyzing',
    description: 'Analytical / research-oriented questions with examples.',
  },
  {
    level: 'K5',
    label: 'Evaluating',
    description: 'Creating, solving, or proving type questions.',
  },
  {
    level: 'K6',
    label: 'Creating',
    description: 'Design and implementation type questions.',
  },
]

function BTLBadge() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white transition-colors">BTL Level Guide (K1–K6)</h3>
      <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
        {LEVELS.map((lvl) => (
          <li
            key={lvl.level}
            className="flex gap-2 items-start rounded-md bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 transition-colors"
          >
            <span className="inline-flex items-center justify-center rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-semibold px-2 py-0.5">
              {lvl.level}
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-xs transition-colors">
                {lvl.label} ({lvl.level})
              </p>
              <p className="text-[11px] text-gray-700 dark:text-gray-400 transition-colors">{lvl.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default BTLBadge