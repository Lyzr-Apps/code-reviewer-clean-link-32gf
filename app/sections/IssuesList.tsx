'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiChevronDown, FiChevronUp, FiCopy, FiCheck, FiFile, FiHash, FiFilter } from 'react-icons/fi'
import { VscLightbulb, VscCode } from 'react-icons/vsc'

interface ReviewIssue {
  id: number
  severity: string
  category: string
  title: string
  description: string
  file: string
  line: string
  code_snippet: string
  suggestion: string
  suggested_code: string
}

interface IssuesListProps {
  issues: ReviewIssue[]
}

const severityConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string; label: string; order: number }> = {
  critical: {
    icon: FiAlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: 'Critical',
    order: 0,
  },
  warning: {
    icon: FiAlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    label: 'Warning',
    order: 1,
  },
  suggestion: {
    icon: VscLightbulb,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    label: 'Suggestion',
    order: 2,
  },
  info: {
    icon: FiInfo,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    label: 'Info',
    order: 3,
  },
}

const categoryLabels: Record<string, string> = {
  code_quality: 'Code Quality',
  security: 'Security',
  performance: 'Performance',
  best_practices: 'Best Practices',
}

function IssueCard({ issue }: { issue: ReviewIssue }) {
  const [codeOpen, setCodeOpen] = useState(false)
  const [fixOpen, setFixOpen] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [fixCopied, setFixCopied] = useState(false)

  const config = severityConfig[issue?.severity] ?? severityConfig.info
  const SeverityIcon = config.icon

  const handleCopy = useCallback(async (text: string, type: 'code' | 'fix') => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'code') {
        setCodeCopied(true)
        setTimeout(() => setCodeCopied(false), 2000)
      } else {
        setFixCopied(true)
        setTimeout(() => setFixCopied(false), 2000)
      }
    } catch {
      // Clipboard API not available
    }
  }, [])

  return (
    <Card className={`border-slate-700/40 bg-slate-800/60 hover:bg-slate-800/80 transition-all duration-200 overflow-hidden`}>
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-md ${config.bg} border ${config.border} flex-shrink-0 mt-0.5`}>
            <SeverityIcon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`${config.bg} ${config.color} border-0 text-xs px-2 py-0`}>
                {config.label}
              </Badge>
              <Badge className="bg-slate-700/50 text-slate-400 border-0 text-xs px-2 py-0">
                {categoryLabels[issue?.category] ?? issue?.category ?? 'General'}
              </Badge>
            </div>
            <h4 className="text-sm font-semibold text-slate-200 leading-tight">
              {issue?.title ?? 'Untitled Issue'}
            </h4>
          </div>
        </div>

        {/* Description */}
        {issue?.description && (
          <p className="text-sm text-slate-400 leading-relaxed pl-11">
            {issue.description}
          </p>
        )}

        {/* File + Line */}
        {(issue?.file || issue?.line) && (
          <div className="flex items-center gap-3 pl-11 text-xs text-slate-500">
            {issue?.file && (
              <span className="flex items-center gap-1">
                <FiFile className="w-3 h-3" />
                <span className="font-mono">{issue.file}</span>
              </span>
            )}
            {issue?.line && (
              <span className="flex items-center gap-1">
                <FiHash className="w-3 h-3" />
                <span className="font-mono">Line {issue.line}</span>
              </span>
            )}
          </div>
        )}

        {/* Suggestion text */}
        {issue?.suggestion && (
          <div className="pl-11 flex items-start gap-2 p-3 rounded-md bg-cyan-500/5 border border-cyan-500/10">
            <VscLightbulb className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-cyan-300/80 leading-relaxed">{issue.suggestion}</p>
          </div>
        )}

        {/* Collapsible Code Blocks */}
        <div className="pl-11 space-y-2">
          {issue?.code_snippet && (
            <Collapsible open={codeOpen} onOpenChange={setCodeOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  <VscCode className="w-3.5 h-3.5" />
                  <span>Original Code</span>
                  {codeOpen ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 relative group">
                  <pre className="bg-slate-900/80 border border-slate-700/50 rounded-md p-3 overflow-x-auto text-xs text-slate-300 font-mono leading-relaxed">
                    <code>{issue.code_snippet}</code>
                  </pre>
                  <button
                    onClick={() => handleCopy(issue.code_snippet, 'code')}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-700/60 hover:bg-slate-600/80 text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-all"
                    title="Copy code"
                  >
                    {codeCopied ? <FiCheck className="w-3 h-3 text-emerald-400" /> : <FiCopy className="w-3 h-3" />}
                  </button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {issue?.suggested_code && (
            <Collapsible open={fixOpen} onOpenChange={setFixOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-xs text-emerald-500/70 hover:text-emerald-400 transition-colors">
                  <VscLightbulb className="w-3.5 h-3.5" />
                  <span>Suggested Fix</span>
                  {fixOpen ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 relative group">
                  <pre className="bg-emerald-950/30 border border-emerald-700/30 rounded-md p-3 overflow-x-auto text-xs text-emerald-300/90 font-mono leading-relaxed">
                    <code>{issue.suggested_code}</code>
                  </pre>
                  <button
                    onClick={() => handleCopy(issue.suggested_code, 'fix')}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-700/60 hover:bg-slate-600/80 text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-all"
                    title="Copy fix"
                  >
                    {fixCopied ? <FiCheck className="w-3 h-3 text-emerald-400" /> : <FiCopy className="w-3 h-3" />}
                  </button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function IssuesList({ issues }: IssuesListProps) {
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const safeIssues = Array.isArray(issues) ? issues : []

  const filteredIssues = useMemo(() => {
    let filtered = safeIssues
    if (severityFilter !== 'all') {
      filtered = filtered.filter((i) => i?.severity === severityFilter)
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((i) => i?.category === categoryFilter)
    }
    // Sort by severity order
    filtered.sort((a, b) => {
      const orderA = severityConfig[a?.severity]?.order ?? 4
      const orderB = severityConfig[b?.severity]?.order ?? 4
      return orderA - orderB
    })
    return filtered
  }, [safeIssues, severityFilter, categoryFilter])

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: safeIssues.length }
    safeIssues.forEach((issue) => {
      const sev = issue?.severity ?? 'info'
      counts[sev] = (counts[sev] ?? 0) + 1
    })
    return counts
  }, [safeIssues])

  if (safeIssues.length === 0) {
    return null
  }

  return (
    <Card className="border-slate-700/50 bg-slate-800/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
            <FiFilter className="w-5 h-5 text-slate-400" />
            Issues ({filteredIssues.length})
          </CardTitle>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex flex-wrap gap-2 mt-3">
          {(['all', 'critical', 'warning', 'suggestion', 'info'] as const).map((sev) => {
            const count = severityCounts[sev] ?? 0
            if (sev !== 'all' && count === 0) return null
            const isActive = severityFilter === sev
            const config = sev === 'all' ? null : severityConfig[sev]
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isActive ? 'bg-slate-600/60 text-slate-100 shadow-sm' : 'bg-slate-800/40 text-slate-500 hover:text-slate-300 hover:bg-slate-700/40'}`}
              >
                {config && <config.icon className={`w-3 h-3 ${isActive ? config.color : ''}`} />}
                <span>{sev === 'all' ? 'All' : config?.label ?? sev}</span>
                <span className={`ml-0.5 px-1.5 py-0.5 rounded text-xs ${isActive ? 'bg-slate-500/40' : 'bg-slate-700/40'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mt-2">
          {(['all', 'code_quality', 'security', 'performance', 'best_practices'] as const).map((cat) => {
            const isActive = categoryFilter === cat
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${isActive ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800/40 text-slate-500 hover:text-slate-300 hover:bg-slate-700/40 border border-transparent'}`}
              >
                {cat === 'all' ? 'All Categories' : categoryLabels[cat] ?? cat}
              </button>
            )
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No issues match the selected filters.
          </div>
        ) : (
          filteredIssues.map((issue, idx) => (
            <IssueCard key={issue?.id ?? idx} issue={issue} />
          ))
        )}
      </CardContent>
    </Card>
  )
}
