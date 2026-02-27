'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VscCode } from 'react-icons/vsc'
import { FiLoader, FiUpload } from 'react-icons/fi'

const LANGUAGES = [
  'Auto-detect',
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'Go',
  'Rust',
  'C++',
  'C#',
  'Ruby',
  'PHP',
  'Swift',
  'Kotlin',
  'Scala',
  'HTML/CSS',
  'SQL',
  'Shell/Bash',
]

interface CodeInputProps {
  code: string
  setCode: (code: string) => void
  fileName: string
  setFileName: (name: string) => void
  language: string
  setLanguage: (lang: string) => void
  onSubmit: () => void
  loading: boolean
}

export default function CodeInput({
  code,
  setCode,
  fileName,
  setFileName,
  language,
  setLanguage,
  onSubmit,
  loading,
}: CodeInputProps) {
  return (
    <Card className="border-slate-700/50 bg-slate-800/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl text-slate-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <VscCode className="w-5 h-5 text-cyan-400" />
          </div>
          Submit Code for Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">File Name (optional)</Label>
            <Input
              placeholder="e.g. main.ts, app.py"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="bg-slate-900/60 border-slate-600/50 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-slate-900/60 border-slate-600/50 text-slate-200 focus:ring-cyan-500/20">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang} className="text-slate-200 focus:bg-slate-700 focus:text-white">
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300 text-sm">
            Paste your code, PR diff, or code file content
          </Label>
          <div className="relative">
            <Textarea
              placeholder={`// Paste your code here for review...\n// Supports raw code, PR diffs, or entire file contents\n\nfunction example() {\n  // Your code here\n}`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="min-h-[320px] bg-slate-900/80 border-slate-600/50 text-slate-200 placeholder:text-slate-600 font-mono text-sm leading-relaxed resize-y focus:border-cyan-500/50 focus:ring-cyan-500/20"
            />
            {code.length > 0 && (
              <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                {code.split('\n').length} lines
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Tip: Include as much context as possible for a more thorough review
          </p>
          <Button
            onClick={onSubmit}
            disabled={loading || !code.trim()}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium px-6 py-2 shadow-lg shadow-cyan-500/20 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                <span>Analyzing code...</span>
              </>
            ) : (
              <>
                <FiUpload className="w-4 h-4" />
                <span>Start Review</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
