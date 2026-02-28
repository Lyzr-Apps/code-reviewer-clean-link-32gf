'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { FiGitPullRequest, FiCheckCircle, FiClock, FiFile, FiHash, FiActivity, FiCpu, FiGithub, FiCode } from 'react-icons/fi'
import { VscCode, VscRepo } from 'react-icons/vsc'

import CodeInput from './sections/CodeInput'
import RepoInput from './sections/RepoInput'
import type { RepoFile } from './sections/RepoInput'
import ScoreOverview from './sections/ScoreOverview'
import CategoryBreakdown from './sections/CategoryBreakdown'
import IssuesList from './sections/IssuesList'

// ─── Agent ID ───────────────────────────────────────────────────────────────
const AGENT_ID = '69a1f10fa9ff34dc03db5b46'

// ─── Theme ──────────────────────────────────────────────────────────────────
const THEME_VARS: React.CSSProperties = {
  '--background': '222 47% 6%',
  '--foreground': '210 40% 98%',
  '--card': '222 47% 9%',
  '--card-foreground': '210 40% 98%',
  '--popover': '222 47% 9%',
  '--popover-foreground': '210 40% 98%',
  '--primary': '190 80% 50%',
  '--primary-foreground': '222 47% 6%',
  '--secondary': '217 33% 17%',
  '--secondary-foreground': '210 40% 98%',
  '--muted': '217 33% 17%',
  '--muted-foreground': '215 20% 55%',
  '--accent': '217 33% 17%',
  '--accent-foreground': '210 40% 98%',
  '--destructive': '0 63% 31%',
  '--destructive-foreground': '210 40% 98%',
  '--border': '217 33% 17%',
  '--input': '217 33% 17%',
  '--ring': '190 80% 50%',
} as React.CSSProperties

// ─── TypeScript Interfaces ──────────────────────────────────────────────────
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

interface CategoryScore {
  score: number
  issues_count: number
}

interface ReviewMetadataType {
  files_reviewed: number
  lines_analyzed: number
  review_duration: string
  languages_detected: string[]
}

interface CodeReviewResult {
  overall_score: number
  summary: string
  total_issues: number
  critical_issues: number
  warnings: number
  suggestions: number
  categories: {
    code_quality: CategoryScore
    security: CategoryScore
    performance: CategoryScore
    best_practices: CategoryScore
  }
  issues: ReviewIssue[]
  positive_highlights: string[]
  review_metadata: ReviewMetadataType
}

// ─── Sample Data ────────────────────────────────────────────────────────────
const SAMPLE_CODE = `function processUserData(users) {
  var results = [];
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    // SQL injection vulnerability
    var query = "SELECT * FROM users WHERE id = " + user.id;
    eval(query);

    // Memory leak - large objects in closure
    results.push(function() {
      return user;
    });

    // No input validation
    user.email = user.input_email;
    user.password = user.input_password; // Storing plain text password

    console.log("Processing user: " + user.password); // Logging sensitive data
  }
  return results;
}`

const SAMPLE_RESULT: CodeReviewResult = {
  overall_score: 3,
  summary: 'The code has critical security vulnerabilities including SQL injection, eval usage, and plain-text password storage. There are also significant performance concerns with closures in loops and use of var instead of const/let. Immediate remediation is strongly recommended before this code reaches production.',
  total_issues: 8,
  critical_issues: 4,
  warnings: 2,
  suggestions: 2,
  categories: {
    code_quality: { score: 4, issues_count: 2 },
    security: { score: 1, issues_count: 4 },
    performance: { score: 5, issues_count: 1 },
    best_practices: { score: 3, issues_count: 1 },
  },
  issues: [
    {
      id: 1,
      severity: 'critical',
      category: 'security',
      title: 'SQL Injection Vulnerability',
      description: 'String concatenation is used to build a SQL query with user-supplied input. This allows an attacker to inject arbitrary SQL commands and potentially access, modify, or delete database contents.',
      file: 'processUserData.js',
      line: '6',
      code_snippet: 'var query = "SELECT * FROM users WHERE id = " + user.id;',
      suggestion: 'Use parameterized queries or an ORM to safely pass user input to SQL queries.',
      suggested_code: 'const query = db.prepare("SELECT * FROM users WHERE id = ?");\nconst result = query.get(user.id);',
    },
    {
      id: 2,
      severity: 'critical',
      category: 'security',
      title: 'Use of eval() with dynamic content',
      description: 'eval() executes arbitrary code and is one of the most dangerous JavaScript functions. Combined with user input, this creates a remote code execution vulnerability.',
      file: 'processUserData.js',
      line: '7',
      code_snippet: 'eval(query);',
      suggestion: 'Remove eval() entirely. Use proper database query execution methods instead.',
      suggested_code: 'const result = await db.execute(query);',
    },
    {
      id: 3,
      severity: 'critical',
      category: 'security',
      title: 'Plain-text password storage',
      description: 'Passwords are stored without any hashing or encryption, violating basic security principles. If the database is compromised, all user passwords will be exposed.',
      file: 'processUserData.js',
      line: '14',
      code_snippet: 'user.password = user.input_password; // Storing plain text password',
      suggestion: 'Hash passwords using bcrypt or argon2 before storage.',
      suggested_code: 'const bcrypt = require("bcrypt");\nuser.password = await bcrypt.hash(user.input_password, 12);',
    },
    {
      id: 4,
      severity: 'critical',
      category: 'security',
      title: 'Sensitive data logged to console',
      description: 'User passwords are being logged to the console, which could expose credentials in log files, monitoring systems, or browser developer tools.',
      file: 'processUserData.js',
      line: '16',
      code_snippet: 'console.log("Processing user: " + user.password);',
      suggestion: 'Never log sensitive information. Log only non-sensitive identifiers.',
      suggested_code: 'console.log(`Processing user: ${user.id}`);',
    },
    {
      id: 5,
      severity: 'warning',
      category: 'performance',
      title: 'Closure in loop captures mutable variable',
      description: 'Creating closures inside a for loop that capture the loop variable causes all closures to reference the same variable, leading to unexpected behavior and potential memory leaks.',
      file: 'processUserData.js',
      line: '10-12',
      code_snippet: 'results.push(function() {\n  return user;\n});',
      suggestion: 'Use Array.map() or let/const block-scoped variables instead of closures in loops.',
      suggested_code: 'const results = users.map(user => ({\n  getData: () => ({ ...user })\n}));',
    },
    {
      id: 6,
      severity: 'warning',
      category: 'code_quality',
      title: 'Use of var instead of const/let',
      description: 'The var keyword has function-level scoping which can lead to subtle bugs. Modern JavaScript should use const for immutable bindings and let for mutable ones.',
      file: 'processUserData.js',
      line: '1-5',
      code_snippet: 'var results = [];\nfor (var i = 0; i < users.length; i++) {\n  var user = users[i];',
      suggestion: 'Replace var with const or let throughout the function.',
      suggested_code: 'const results = [];\nfor (let i = 0; i < users.length; i++) {\n  const user = users[i];',
    },
    {
      id: 7,
      severity: 'suggestion',
      category: 'code_quality',
      title: 'Missing input validation',
      description: 'The function does not validate its input parameter. If users is null, undefined, or not an array, the function will throw a runtime error.',
      file: 'processUserData.js',
      line: '1',
      code_snippet: 'function processUserData(users) {',
      suggestion: 'Add input validation at the start of the function and use TypeScript for type safety.',
      suggested_code: 'function processUserData(users: User[]): ProcessedUser[] {\n  if (!Array.isArray(users)) {\n    throw new TypeError("Expected an array of users");\n  }',
    },
    {
      id: 8,
      severity: 'suggestion',
      category: 'best_practices',
      title: 'Function lacks error handling',
      description: 'The function performs database operations and data transformations without any try/catch blocks or error handling, which could lead to unhandled exceptions in production.',
      file: 'processUserData.js',
      line: '1-18',
      code_snippet: 'function processUserData(users) {\n  // ... no error handling',
      suggestion: 'Wrap the function body in try/catch and handle errors gracefully.',
      suggested_code: 'async function processUserData(users: User[]) {\n  try {\n    // ... processing logic\n  } catch (error) {\n    logger.error("Failed to process users", { error });\n    throw new AppError("User processing failed", error);\n  }\n}',
    },
  ],
  positive_highlights: [
    'Function has a clear, descriptive name that indicates its purpose.',
    'Results are collected and returned, following a functional pattern.',
    'Code is structured in a linear, readable flow.',
  ],
  review_metadata: {
    files_reviewed: 1,
    lines_analyzed: 18,
    review_duration: '2.3s',
    languages_detected: ['JavaScript'],
  },
}

// ─── Error Boundary ─────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-slate-400 mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-cyan-600 text-white rounded-md text-sm hover:bg-cyan-500 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Positive Highlights Component ──────────────────────────────────────────
function PositiveHighlights({ highlights }: { highlights: string[] }) {
  const safeHighlights = Array.isArray(highlights) ? highlights : []
  if (safeHighlights.length === 0) return null

  return (
    <Card className="border-slate-700/50 bg-slate-800/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/30">
            <FiCheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          Positive Highlights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {safeHighlights.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 py-2 px-3 rounded-md bg-emerald-500/5 border border-emerald-500/10">
              <FiCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-300 leading-relaxed">{item ?? ''}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// ─── Review Metadata Component ──────────────────────────────────────────────
function ReviewMetadata({ metadata }: { metadata: ReviewMetadataType | undefined }) {
  if (!metadata) return null
  const languages = Array.isArray(metadata?.languages_detected) ? metadata.languages_detected : []

  return (
    <Card className="border-slate-700/50 bg-slate-800/60 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <FiFile className="w-3.5 h-3.5" />
            <span className="text-slate-400 font-medium">{metadata?.files_reviewed ?? 0}</span> files reviewed
          </span>
          <span className="flex items-center gap-1.5">
            <FiHash className="w-3.5 h-3.5" />
            <span className="text-slate-400 font-medium">{metadata?.lines_analyzed ?? 0}</span> lines analyzed
          </span>
          <span className="flex items-center gap-1.5">
            <FiClock className="w-3.5 h-3.5" />
            Duration: <span className="text-slate-400 font-medium">{metadata?.review_duration ?? 'N/A'}</span>
          </span>
          {languages.length > 0 && (
            <span className="flex items-center gap-1.5">
              <VscCode className="w-3.5 h-3.5" />
              Languages:
              {languages.map((lang, idx) => (
                <Badge key={idx} className="bg-slate-700/50 text-slate-400 border-0 text-xs px-1.5 py-0">
                  {lang ?? ''}
                </Badge>
              ))}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Agent Status Component ─────────────────────────────────────────────────
function AgentStatus({ isActive }: { isActive: boolean }) {
  return (
    <Card className="border-slate-700/50 bg-slate-800/60 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
            <div>
              <p className="text-xs font-medium text-slate-300">CodeReview AI Agent</p>
              <p className="text-xs text-slate-500 font-mono">{AGENT_ID}</p>
            </div>
          </div>
          <Badge className={`text-xs border-0 ${isActive ? 'bg-cyan-500/15 text-cyan-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
            {isActive ? 'Analyzing...' : 'Ready'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
type InputMode = 'paste' | 'repo'

export default function Page() {
  // State
  const [inputMode, setInputMode] = useState<InputMode>('paste')
  const [code, setCode] = useState('')
  const [fileName, setFileName] = useState('')
  const [language, setLanguage] = useState('Auto-detect')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null)
  const [showSampleData, setShowSampleData] = useState(false)
  const [, setActiveAgentId] = useState<string | null>(null)
  const [repoContext, setRepoContext] = useState<{ owner: string; repo: string; branch: string } | null>(null)
  const [loadingMessage, setLoadingMessage] = useState<string>('Analyzing your code...')

  // The displayed data — either from agent or sample
  const displayData = useMemo(() => {
    if (showSampleData) return SAMPLE_RESULT
    return reviewResult
  }, [showSampleData, reviewResult])

  // Helper to parse agent result
  const parseAgentResult = useCallback((result: any): CodeReviewResult | null => {
    if (!result?.success) return null
    let parsed = result?.response?.result
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed)
      } catch {
        parsed = {
          summary: parsed, overall_score: 0, total_issues: 0,
          critical_issues: 0, warnings: 0, suggestions: 0,
          categories: {}, issues: [], positive_highlights: [],
          review_metadata: {},
        }
      }
    }
    return parsed as CodeReviewResult
  }, [])

  // Submit code for review (paste mode)
  const handleSubmit = useCallback(async () => {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    setActiveAgentId(AGENT_ID)
    setLoadingMessage('Analyzing your code...')
    setRepoContext(null)

    try {
      const languageHint = language !== 'Auto-detect' ? `\nLanguage: ${language}` : ''
      const fileHint = fileName ? `\nFile: ${fileName}` : ''
      const message = `Review the following code:${fileHint}${languageHint}\n\n${code}`

      const result = await callAIAgent(message, AGENT_ID)

      if (result.success) {
        const parsed = parseAgentResult(result)
        if (parsed) setReviewResult(parsed)
      } else {
        setError(result?.error ?? 'Failed to get review results. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [code, fileName, language, parseAgentResult])

  // Submit repo files for review (repo mode)
  const handleRepoSubmit = useCallback(async (
    files: RepoFile[],
    repoInfo: { owner: string; repo: string; branch: string }
  ) => {
    if (files.length === 0) return
    setLoading(true)
    setError(null)
    setActiveAgentId(AGENT_ID)
    setRepoContext(repoInfo)
    setLoadingMessage(`Analyzing ${files.length} files from ${repoInfo.owner}/${repoInfo.repo}...`)

    try {
      // Build a combined message with all files
      const fileContents = files.map(f =>
        `--- FILE: ${f.path} (${f.language}) ---\n${f.content}`
      ).join('\n\n')

      const totalLines = files.reduce((sum, f) => sum + f.content.split('\n').length, 0)
      const languages = [...new Set(files.map(f => f.language).filter(l => l && l !== 'Unknown'))]

      const message = `Review the following GitHub repository code from ${repoInfo.owner}/${repoInfo.repo} (branch: ${repoInfo.branch}).

Repository contains ${files.length} code files across ${languages.length} languages: ${languages.join(', ')}.
Total lines of code: ${totalLines}.

Analyze ALL files together as a complete codebase. Look for:
- Cross-file issues (inconsistent patterns, missing imports, circular dependencies)
- Security vulnerabilities across the entire codebase
- Architecture and design pattern issues
- Code quality and consistency across files
- Performance bottlenecks that may span multiple files

Here are all the files:

${fileContents}`

      const result = await callAIAgent(message, AGENT_ID)

      if (result.success) {
        const parsed = parseAgentResult(result)
        if (parsed) setReviewResult(parsed)
      } else {
        setError(result?.error ?? 'Failed to get review results. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [parseAgentResult])

  // When sample data is toggled on, fill in sample code
  const handleSampleToggle = useCallback((checked: boolean) => {
    setShowSampleData(checked)
    if (checked) {
      setCode(SAMPLE_CODE)
      setFileName('processUserData.js')
      setLanguage('JavaScript')
      setInputMode('paste')
    } else {
      if (code === SAMPLE_CODE) {
        setCode('')
        setFileName('')
        setLanguage('Auto-detect')
      }
    }
  }, [code])

  const hasResults = displayData !== null

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-slate-950 text-slate-100">
        {/* Header */}
        <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                  <FiGitPullRequest className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                    CodeReview AI
                  </h1>
                  <p className="text-xs text-slate-500">
                    Automated Code Review & Analysis
                  </p>
                </div>
              </div>

              {/* Sample Data Toggle */}
              <div className="flex items-center gap-2">
                <Label htmlFor="sample-toggle" className="text-xs text-slate-500 cursor-pointer">
                  Sample Data
                </Label>
                <Switch
                  id="sample-toggle"
                  checked={showSampleData}
                  onCheckedChange={handleSampleToggle}
                />
              </div>
            </div>

            {/* Input Mode Tabs */}
            <div className="flex items-center gap-1 mt-4 bg-slate-900/60 rounded-lg p-1 w-fit">
              <button
                onClick={() => setInputMode('paste')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  inputMode === 'paste'
                    ? 'bg-slate-700/80 text-cyan-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <FiCode className="w-4 h-4" />
                Paste Code
              </button>
              <button
                onClick={() => setInputMode('repo')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  inputMode === 'repo'
                    ? 'bg-slate-700/80 text-purple-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <FiGithub className="w-4 h-4" />
                GitHub Repo
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Input Section — Paste Code or GitHub Repo */}
          {inputMode === 'paste' ? (
            <CodeInput
              code={code}
              setCode={setCode}
              fileName={fileName}
              setFileName={setFileName}
              language={language}
              setLanguage={setLanguage}
              onSubmit={handleSubmit}
              loading={loading}
            />
          ) : (
            <RepoInput
              onSubmitRepo={handleRepoSubmit}
              loading={loading}
            />
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <FiActivity className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-400">Review Failed</p>
                  <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <Card className="border-slate-700/50 bg-slate-800/60 backdrop-blur-sm">
              <CardContent className="p-8 flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
                  <FiCpu className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-300">{loadingMessage}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {repoContext
                      ? `Reviewing entire codebase of ${repoContext.owner}/${repoContext.repo}`
                      : 'This may take a moment for thorough analysis'}
                  </p>
                  {repoContext && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <VscRepo className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs text-purple-400/80 font-mono">
                        {repoContext.owner}/{repoContext.repo}@{repoContext.branch}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Dashboard */}
          {!loading && hasResults && (
            <div className="space-y-6">
              {/* Repo Context Banner */}
              {repoContext && !showSampleData && (
                <Card className="border-purple-500/20 bg-purple-500/5">
                  <CardContent className="p-3 flex items-center gap-3">
                    <VscRepo className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="text-slate-300 font-medium">Repository Review:</span>
                      <span className="text-purple-400 font-mono text-xs bg-purple-500/10 px-2 py-0.5 rounded">
                        {repoContext.owner}/{repoContext.repo}
                      </span>
                      <Badge className="bg-slate-700/50 text-slate-400 border-0 text-xs">{repoContext.branch}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Score Overview */}
              <ScoreOverview data={displayData as CodeReviewResult} />

              {/* Category Breakdown */}
              <div>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <VscCode className="w-4 h-4" />
                  Category Breakdown
                </h2>
                <CategoryBreakdown categories={displayData?.categories} />
              </div>

              {/* Issues */}
              <div>
                <IssuesList issues={Array.isArray(displayData?.issues) ? displayData.issues : []} />
              </div>

              {/* Positive Highlights */}
              <PositiveHighlights highlights={Array.isArray(displayData?.positive_highlights) ? displayData.positive_highlights : []} />

              {/* Review Metadata */}
              <ReviewMetadata metadata={displayData?.review_metadata} />
            </div>
          )}

          {/* Empty State — shown when no results and not loading */}
          {!loading && !hasResults && !error && (
            <Card className="border-slate-700/30 bg-slate-800/40 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 mb-4">
                  <VscCode className="w-8 h-8 text-cyan-500/60" />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">
                  Ready to Review Your Code
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  {inputMode === 'paste'
                    ? 'Paste your code, PR diff, or file content above to get an in-depth automated review covering code quality, security vulnerabilities, performance issues, and best practices.'
                    : 'Enter a GitHub repository URL above to fetch and analyze the entire codebase. All code files will be scanned for issues across quality, security, performance, and best practices.'}
                </p>
                <p className="text-xs text-slate-600 mt-4">
                  Toggle "Sample Data" to see an example review, or switch to "{inputMode === 'paste' ? 'GitHub Repo' : 'Paste Code'}" mode in the header.
                </p>
              </CardContent>
            </Card>
          )}

          <Separator className="bg-slate-800/50" />

          {/* Agent Status Footer */}
          <AgentStatus isActive={loading} />
        </main>
      </div>
    </ErrorBoundary>
  )
}
