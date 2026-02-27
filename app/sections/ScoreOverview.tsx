'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FiAlertCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi'
import { VscLightbulb } from 'react-icons/vsc'

interface CodeReviewResult {
  overall_score: number
  summary: string
  total_issues: number
  critical_issues: number
  warnings: number
  suggestions: number
}

interface ScoreOverviewProps {
  data: CodeReviewResult
}

function getScoreColor(score: number): { text: string; bg: string; ring: string; gradient: string } {
  if (score >= 8) return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', ring: 'ring-emerald-500/40', gradient: 'from-emerald-500 to-green-500' }
  if (score >= 6) return { text: 'text-yellow-400', bg: 'bg-yellow-500/20', ring: 'ring-yellow-500/40', gradient: 'from-yellow-500 to-amber-500' }
  if (score >= 4) return { text: 'text-orange-400', bg: 'bg-orange-500/20', ring: 'ring-orange-500/40', gradient: 'from-orange-500 to-red-400' }
  return { text: 'text-red-400', bg: 'bg-red-500/20', ring: 'ring-red-500/40', gradient: 'from-red-500 to-rose-600' }
}

function getScoreLabel(score: number): string {
  if (score >= 8) return 'Excellent'
  if (score >= 6) return 'Good'
  if (score >= 4) return 'Fair'
  return 'Needs Work'
}

export default function ScoreOverview({ data }: ScoreOverviewProps) {
  const score = data?.overall_score ?? 0
  const colors = getScoreColor(score)
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (score / 10) * circumference

  return (
    <Card className="border-slate-700/50 bg-slate-800/80 backdrop-blur-sm shadow-xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Score Gauge */}
          <div className="flex-shrink-0 relative">
            <svg width="140" height="140" viewBox="0 0 120 120" className="transform -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-700/50"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={colors.text}
                stroke="currentColor"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${colors.text}`}>
                {score}
              </span>
              <span className="text-xs text-slate-400 font-medium">/10</span>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className={`text-lg font-semibold ${colors.text}`}>
                {getScoreLabel(score)}
              </span>
              <Badge className={`${colors.bg} ${colors.text} border-0 text-xs`}>
                {score >= 8 ? 'Pass' : score >= 4 ? 'Review' : 'Fail'}
              </Badge>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {data?.summary ?? 'No summary available.'}
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/50">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/40">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-700/50">
              <FiInfo className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-200">{data?.total_issues ?? 0}</p>
              <p className="text-xs text-slate-500">Total Issues</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-red-500/10">
              <FiAlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-red-400">{data?.critical_issues ?? 0}</p>
              <p className="text-xs text-slate-500">Critical</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/5">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-yellow-500/10">
              <FiAlertTriangle className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-400">{data?.warnings ?? 0}</p>
              <p className="text-xs text-slate-500">Warnings</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/5">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-500/10">
              <VscLightbulb className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-blue-400">{data?.suggestions ?? 0}</p>
              <p className="text-xs text-slate-500">Suggestions</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
