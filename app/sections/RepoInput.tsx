'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FiGithub, FiLoader, FiSearch, FiFile, FiFolder, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi'
import { VscRepo, VscGitBranch } from 'react-icons/vsc'

export interface RepoFile {
  path: string
  content: string
  size: number
  language: string
}

interface TreeItem {
  path: string
  size: number
}

interface RepoInputProps {
  onSubmitRepo: (files: RepoFile[], repoInfo: { owner: string; repo: string; branch: string }) => void
  loading: boolean
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  const iconMap: Record<string, string> = {
    ts: 'TS', tsx: 'TX', js: 'JS', jsx: 'JX',
    py: 'PY', java: 'JV', go: 'GO', rs: 'RS',
    rb: 'RB', php: 'PH', cs: 'C#', cpp: 'C+',
    c: 'C', swift: 'SW', kt: 'KT', dart: 'DT',
    vue: 'VU', svelte: 'SV', sql: 'SQ', sh: 'SH',
    html: 'HT', css: 'CS', scss: 'SC', json: 'JN',
    yml: 'YM', yaml: 'YM', md: 'MD', toml: 'TM',
    xml: 'XM', graphql: 'GQ', proto: 'PB', prisma: 'PR',
  }
  return iconMap[ext] || ext.toUpperCase().slice(0, 2)
}

function getLanguageColor(language: string): string {
  const colorMap: Record<string, string> = {
    TypeScript: 'text-blue-400',
    JavaScript: 'text-yellow-400',
    Python: 'text-green-400',
    Go: 'text-cyan-400',
    Rust: 'text-orange-400',
    Java: 'text-red-400',
    'C++': 'text-pink-400',
    'C#': 'text-purple-400',
    Ruby: 'text-red-300',
    PHP: 'text-indigo-400',
    Swift: 'text-orange-300',
    Kotlin: 'text-violet-400',
    Shell: 'text-green-300',
    HTML: 'text-orange-400',
    CSS: 'text-blue-300',
    JSON: 'text-yellow-300',
    YAML: 'text-rose-300',
    SQL: 'text-emerald-400',
    Markdown: 'text-slate-300',
  }
  return colorMap[language] || 'text-slate-400'
}

export default function RepoInput({ onSubmitRepo, loading }: RepoInputProps) {
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetchedFiles, setFetchedFiles] = useState<RepoFile[]>([])
  const [repoInfo, setRepoInfo] = useState<{ owner: string; repo: string; branch: string } | null>(null)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [treeItems, setTreeItems] = useState<TreeItem[]>([])
  const [totalInRepo, setTotalInRepo] = useState(0)

  const handleFetch = useCallback(async () => {
    if (!repoUrl.trim()) return
    setFetching(true)
    setFetchError(null)
    setFetchedFiles([])
    setSelectedPaths(new Set())
    setTreeItems([])
    setRepoInfo(null)

    try {
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim(), branch: branch.trim() || undefined }),
      })

      const data = await res.json()

      if (!data.success) {
        setFetchError(data.error || 'Failed to fetch repository')
        return
      }

      const files: RepoFile[] = Array.isArray(data.files) ? data.files : []
      setFetchedFiles(files)
      setRepoInfo({ owner: data.owner, repo: data.repo, branch: data.branch })
      setTreeItems(Array.isArray(data.tree) ? data.tree : [])
      setTotalInRepo(data.totalFiles || files.length)
      // Select all files by default
      setSelectedPaths(new Set(files.map((f: RepoFile) => f.path)))
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Network error fetching repository')
    } finally {
      setFetching(false)
    }
  }, [repoUrl, branch])

  const handleToggleFile = useCallback((path: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedPaths(new Set(fetchedFiles.map(f => f.path)))
  }, [fetchedFiles])

  const handleDeselectAll = useCallback(() => {
    setSelectedPaths(new Set())
  }, [])

  const handleSubmit = useCallback(() => {
    if (!repoInfo || selectedPaths.size === 0) return
    const selected = fetchedFiles.filter(f => selectedPaths.has(f.path))
    onSubmitRepo(selected, repoInfo)
  }, [fetchedFiles, selectedPaths, repoInfo, onSubmitRepo])

  // Group files by directory
  const groupedFiles = React.useMemo(() => {
    const groups: Record<string, RepoFile[]> = {}
    fetchedFiles.forEach(file => {
      const parts = file.path.split('/')
      const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '(root)'
      if (!groups[dir]) groups[dir] = []
      groups[dir].push(file)
    })
    // Sort directories
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [fetchedFiles])

  // Language stats
  const languageStats = React.useMemo(() => {
    const stats: Record<string, number> = {}
    fetchedFiles.forEach(f => {
      if (selectedPaths.has(f.path)) {
        stats[f.language] = (stats[f.language] || 0) + 1
      }
    })
    return Object.entries(stats).sort(([, a], [, b]) => b - a)
  }, [fetchedFiles, selectedPaths])

  const totalSelectedSize = React.useMemo(() => {
    return fetchedFiles
      .filter(f => selectedPaths.has(f.path))
      .reduce((sum, f) => sum + f.size, 0)
  }, [fetchedFiles, selectedPaths])

  const hasFetchedRepo = fetchedFiles.length > 0

  return (
    <Card className="border-slate-700/50 bg-slate-800/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl text-slate-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <FiGithub className="w-5 h-5 text-purple-400" />
          </div>
          Analyze GitHub Repository
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,auto] gap-3 items-end">
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Repository URL</Label>
            <Input
              placeholder="https://github.com/owner/repo  or  owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !fetching) handleFetch() }}
              className="bg-slate-900/60 border-slate-600/50 text-slate-200 placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Branch (optional)</Label>
            <Input
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-slate-900/60 border-slate-600/50 text-slate-200 placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20 w-32"
            />
          </div>
          <Button
            onClick={handleFetch}
            disabled={fetching || !repoUrl.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium px-5 shadow-lg shadow-purple-500/20 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
          >
            {fetching ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                <span>Fetching...</span>
              </>
            ) : (
              <>
                <FiSearch className="w-4 h-4" />
                <span>Fetch Repo</span>
              </>
            )}
          </Button>
        </div>

        {/* Error */}
        {fetchError && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{fetchError}</p>
          </div>
        )}

        {/* Fetching progress */}
        {fetching && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <FiLoader className="w-5 h-5 text-purple-400 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm text-slate-300">Fetching repository files...</p>
              <p className="text-xs text-slate-500 mt-0.5">Scanning file tree and downloading code files</p>
            </div>
          </div>
        )}

        {/* Fetched Repo Info + File List */}
        {hasFetchedRepo && repoInfo && (
          <>
            {/* Repo info header */}
            <div className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <VscRepo className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {repoInfo.owner}/{repoInfo.repo}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <VscGitBranch className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-500 font-mono">{repoInfo.branch}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{totalInRepo} code files in repo</span>
                <span className="text-slate-600">|</span>
                <span>{fetchedFiles.length} files fetched</span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-400 font-medium">{selectedPaths.size} selected</span>
              </div>
            </div>

            {/* Language stats */}
            {languageStats.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {languageStats.map(([lang, count]) => (
                  <Badge
                    key={lang}
                    className={`bg-slate-800/60 border border-slate-700/40 text-xs px-2 py-0.5 ${getLanguageColor(lang)}`}
                  >
                    {lang}: {count}
                  </Badge>
                ))}
              </div>
            )}

            {/* Select controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <FiCheck className="w-3 h-3" /> Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <FiX className="w-3 h-3" /> Deselect All
              </button>
              <span className="text-xs text-slate-600 ml-auto">
                Total: {formatSize(totalSelectedSize)}
              </span>
            </div>

            {/* File tree */}
            <ScrollArea className="h-[300px] rounded-lg border border-slate-700/40 bg-slate-900/40">
              <div className="p-2 space-y-1">
                {groupedFiles.map(([dir, files]) => (
                  <div key={dir}>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-500">
                      <FiFolder className="w-3 h-3 text-slate-600" />
                      <span className="font-mono">{dir}</span>
                    </div>
                    {files.map((file) => {
                      const isSelected = selectedPaths.has(file.path)
                      const fileName = file.path.split('/').pop() || file.path
                      return (
                        <label
                          key={file.path}
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-cyan-500/5 hover:bg-cyan-500/10'
                              : 'hover:bg-slate-800/60'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleFile(file.path)}
                            className="border-slate-600 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                          />
                          <div className="flex items-center justify-center w-6 h-5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-400 flex-shrink-0">
                            {getFileIcon(file.path)}
                          </div>
                          <FiFile className="w-3 h-3 text-slate-600 flex-shrink-0" />
                          <span className={`text-xs font-mono truncate ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                            {fileName}
                          </span>
                          <span className={`text-[10px] ml-auto flex-shrink-0 ${getLanguageColor(file.language)}`}>
                            {file.language}
                          </span>
                          <span className="text-[10px] text-slate-600 flex-shrink-0 ml-1">
                            {formatSize(file.size)}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Submit */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">
                {selectedPaths.size} files selected for analysis ({formatSize(totalSelectedSize)})
              </p>
              <Button
                onClick={handleSubmit}
                disabled={loading || selectedPaths.size === 0}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium px-6 py-2 shadow-lg shadow-cyan-500/20 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    <span>Analyzing {selectedPaths.size} files...</span>
                  </>
                ) : (
                  <>
                    <VscRepo className="w-4 h-4" />
                    <span>Analyze {selectedPaths.size} Files</span>
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Empty state when no repo fetched */}
        {!hasFetchedRepo && !fetching && !fetchError && (
          <div className="text-center py-6">
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter a public GitHub repository URL to fetch and analyze all code files.
              <br />
              Supports formats: https://github.com/owner/repo, owner/repo, or with branch /tree/branch
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
