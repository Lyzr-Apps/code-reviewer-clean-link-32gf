'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FiCode, FiShield, FiZap, FiBookOpen } from 'react-icons/fi'

interface CategoryScore {
  score: number
  issues_count: number
}

interface CategoryBreakdownProps {
  categories: {
    code_quality?: CategoryScore
    security?: CategoryScore
    performance?: CategoryScore
    best_practices?: CategoryScore
  } | undefined
}

function getBarColor(score: number): string {
  if (score >= 8) return 'bg-emerald-500'
  if (score >= 6) return 'bg-yellow-500'
  if (score >= 4) return 'bg-orange-500'
  return 'bg-red-500'
}

function getBarBg(score: number): string {
  if (score >= 8) return 'bg-emerald-500/10'
  if (score >= 6) return 'bg-yellow-500/10'
  if (score >= 4) return 'bg-orange-500/10'
  return 'bg-red-500/10'
}

function getScoreText(score: number): string {
  if (score >= 8) return 'text-emerald-400'
  if (score >= 6) return 'text-yellow-400'
  if (score >= 4) return 'text-orange-400'
  return 'text-red-400'
}

const categoryConfig = [
  {
    key: 'code_quality' as const,
    label: 'Code Quality',
    icon: FiCode,
    iconBg: 'from-violet-500/20 to-purple-500/20',
    iconBorder: 'border-violet-500/30',
    iconColor: 'text-violet-400',
    description: 'Readability, structure & maintainability',
  },
  {
    key: 'security' as const,
    label: 'Security',
    icon: FiShield,
    iconBg: 'from-red-500/20 to-rose-500/20',
    iconBorder: 'border-red-500/30',
    iconColor: 'text-red-400',
    description: 'Vulnerabilities & security concerns',
  },
  {
    key: 'performance' as const,
    label: 'Performance',
    icon: FiZap,
    iconBg: 'from-amber-500/20 to-yellow-500/20',
    iconBorder: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    description: 'Efficiency & optimization',
  },
  {
    key: 'best_practices' as const,
    label: 'Best Practices',
    icon: FiBookOpen,
    iconBg: 'from-cyan-500/20 to-blue-500/20',
    iconBorder: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
    description: 'Standards & conventions',
  },
]

export default function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {categoryConfig.map((cat) => {
        const data = categories?.[cat.key]
        const score = data?.score ?? 0
        const issuesCount = data?.issues_count ?? 0
        const Icon = cat.icon

        return (
          <Card key={cat.key} className="border-slate-700/50 bg-slate-800/80 backdrop-blur-sm hover:border-slate-600/60 transition-all duration-200">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${cat.iconBg} border ${cat.iconBorder}`}>
                  <Icon className={`w-5 h-5 ${cat.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-200">{cat.label}</h3>
                    <span className={`text-lg font-bold ${getScoreText(score)}`}>{score}/10</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                </div>
              </div>

              {/* Score Bar */}
              <div className={`h-2 rounded-full ${getBarBg(score)} overflow-hidden`}>
                <div
                  className={`h-full rounded-full ${getBarColor(score)} transition-all duration-700 ease-out`}
                  style={{ width: `${(score / 10) * 100}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {issuesCount} {issuesCount === 1 ? 'issue' : 'issues'} found
                </span>
                <span className={`text-xs font-medium ${getScoreText(score)}`}>
                  {score >= 8 ? 'Excellent' : score >= 6 ? 'Good' : score >= 4 ? 'Fair' : 'Needs Work'}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
