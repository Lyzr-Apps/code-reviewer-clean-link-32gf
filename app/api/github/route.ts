import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/github
 *
 * Fetches a public GitHub repo's file tree and selected file contents.
 * Accepts: { repoUrl: string, branch?: string }
 * Returns: { success, owner, repo, branch, files: [{ path, content, size, language }], totalFiles, truncatedFiles }
 */

const GITHUB_API = 'https://api.github.com'
const MAX_FILE_SIZE = 100_000 // 100 KB per file
const MAX_TOTAL_SIZE = 500_000 // 500 KB total content
const MAX_FILES = 50 // Max files to fetch content for

// File extensions we want to review (code files only)
const CODE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.pyw',
  '.java', '.kt', '.kts', '.scala',
  '.go',
  '.rs',
  '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp',
  '.cs',
  '.rb',
  '.php',
  '.swift',
  '.dart',
  '.vue', '.svelte',
  '.sol',
  '.r', '.R',
  '.lua',
  '.sh', '.bash', '.zsh',
  '.sql',
  '.graphql', '.gql',
  '.yml', '.yaml',
  '.json',
  '.xml',
  '.toml',
  '.cfg', '.ini', '.conf',
  '.md', '.mdx',
  '.html', '.css', '.scss', '.sass', '.less',
  '.dockerfile',
  '.tf',
  '.prisma',
  '.proto',
])

// Directories to skip
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', '.next',
  '__pycache__', '.cache', 'vendor', 'target', 'bin', 'obj',
  '.idea', '.vscode', 'coverage', '.nyc_output', '.tox',
  'venv', '.venv', 'env', '.env', 'eggs', '.eggs',
])

// Files to skip
const SKIP_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'composer.lock', 'Gemfile.lock', 'Cargo.lock',
  'go.sum', 'poetry.lock', 'Pipfile.lock',
])

function parseGitHubUrl(url: string): { owner: string; repo: string; branch?: string } | null {
  try {
    // Handle various GitHub URL formats
    // https://github.com/owner/repo
    // https://github.com/owner/repo/tree/branch
    // https://github.com/owner/repo.git
    // owner/repo
    let cleaned = url.trim().replace(/\.git$/, '').replace(/\/$/, '')

    // Handle short format: owner/repo
    if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(cleaned)) {
      const [owner, repo] = cleaned.split('/')
      return { owner, repo }
    }

    const urlObj = new URL(cleaned)
    if (urlObj.hostname !== 'github.com') return null

    const parts = urlObj.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null

    const owner = parts[0]
    const repo = parts[1]
    let branch: string | undefined

    // /tree/branch-name or /tree/branch/path
    if (parts[2] === 'tree' && parts[3]) {
      branch = parts[3]
    }

    return { owner, repo, branch }
  } catch {
    return null
  }
}

function getLanguageFromPath(path: string): string {
  const ext = '.' + path.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    '.js': 'JavaScript', '.jsx': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
    '.ts': 'TypeScript', '.tsx': 'TypeScript',
    '.py': 'Python', '.pyw': 'Python',
    '.java': 'Java', '.kt': 'Kotlin', '.kts': 'Kotlin', '.scala': 'Scala',
    '.go': 'Go',
    '.rs': 'Rust',
    '.c': 'C', '.h': 'C', '.cpp': 'C++', '.cc': 'C++', '.cxx': 'C++', '.hpp': 'C++',
    '.cs': 'C#',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.swift': 'Swift',
    '.dart': 'Dart',
    '.vue': 'Vue', '.svelte': 'Svelte',
    '.sol': 'Solidity',
    '.r': 'R', '.R': 'R',
    '.lua': 'Lua',
    '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell',
    '.sql': 'SQL',
    '.html': 'HTML', '.css': 'CSS', '.scss': 'SCSS', '.sass': 'Sass', '.less': 'Less',
    '.json': 'JSON', '.yml': 'YAML', '.yaml': 'YAML', '.toml': 'TOML',
    '.md': 'Markdown', '.mdx': 'MDX',
    '.graphql': 'GraphQL', '.gql': 'GraphQL',
    '.proto': 'Protocol Buffers',
    '.prisma': 'Prisma',
    '.tf': 'Terraform',
    '.xml': 'XML',
  }
  return langMap[ext] || 'Unknown'
}

function shouldIncludeFile(path: string): boolean {
  // Check if in a skipped directory
  const parts = path.split('/')
  for (const part of parts.slice(0, -1)) {
    if (SKIP_DIRS.has(part)) return false
  }

  // Check file name
  const fileName = parts[parts.length - 1]
  if (SKIP_FILES.has(fileName)) return false

  // Check extension
  const ext = fileName.includes('.') ? '.' + fileName.split('.').pop()?.toLowerCase() : ''
  if (!ext) return false // Skip files without extensions (except Dockerfile)
  if (fileName === 'Dockerfile' || fileName === 'Makefile') return true

  return CODE_EXTENSIONS.has(ext)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { repoUrl, branch: requestedBranch } = body

    if (!repoUrl) {
      return NextResponse.json(
        { success: false, error: 'repoUrl is required' },
        { status: 400 }
      )
    }

    const parsed = parseGitHubUrl(repoUrl)
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: 'Invalid GitHub URL. Use format: https://github.com/owner/repo or owner/repo' },
        { status: 400 }
      )
    }

    const { owner, repo } = parsed
    const branch = requestedBranch || parsed.branch

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CodeReview-AI',
    }

    // Optional: if user has a GitHub token in env
    const ghToken = process.env.GITHUB_TOKEN
    if (ghToken) {
      headers['Authorization'] = `Bearer ${ghToken}`
    }

    // 1. Get default branch if not specified
    let targetBranch = branch
    if (!targetBranch) {
      const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers })
      if (!repoRes.ok) {
        if (repoRes.status === 404) {
          return NextResponse.json(
            { success: false, error: `Repository ${owner}/${repo} not found. Make sure it exists and is public.` },
            { status: 404 }
          )
        }
        return NextResponse.json(
          { success: false, error: `GitHub API error: ${repoRes.status} ${repoRes.statusText}` },
          { status: repoRes.status }
        )
      }
      const repoData = await repoRes.json()
      targetBranch = repoData.default_branch || 'main'
    }

    // 2. Get the full file tree recursively
    const treeRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`,
      { headers }
    )

    if (!treeRes.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch repo tree: ${treeRes.status} ${treeRes.statusText}` },
        { status: treeRes.status }
      )
    }

    const treeData = await treeRes.json()
    const allFiles = (treeData.tree || []).filter(
      (item: any) => item.type === 'blob' && shouldIncludeFile(item.path)
    )

    // Sort by size (smaller files first) and limit
    allFiles.sort((a: any, b: any) => (a.size || 0) - (b.size || 0))

    // Filter files by size and collect up to limits
    const filesToFetch: any[] = []
    let totalSize = 0
    for (const file of allFiles) {
      if (filesToFetch.length >= MAX_FILES) break
      if ((file.size || 0) > MAX_FILE_SIZE) continue
      if (totalSize + (file.size || 0) > MAX_TOTAL_SIZE) break
      filesToFetch.push(file)
      totalSize += file.size || 0
    }

    // 3. Fetch content for each file (in batches to avoid rate limits)
    const BATCH_SIZE = 10
    const results: { path: string; content: string; size: number; language: string }[] = []

    for (let i = 0; i < filesToFetch.length; i += BATCH_SIZE) {
      const batch = filesToFetch.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (file: any) => {
          try {
            const contentRes = await fetch(
              `${GITHUB_API}/repos/${owner}/${repo}/contents/${file.path}?ref=${targetBranch}`,
              { headers }
            )
            if (!contentRes.ok) return null

            const contentData = await contentRes.json()
            if (contentData.encoding === 'base64' && contentData.content) {
              const decoded = Buffer.from(contentData.content, 'base64').toString('utf-8')
              // Skip binary-looking files
              if (decoded.includes('\0')) return null
              return {
                path: file.path,
                content: decoded,
                size: file.size || decoded.length,
                language: getLanguageFromPath(file.path),
              }
            }
            return null
          } catch {
            return null
          }
        })
      )
      results.push(...batchResults.filter(Boolean) as any[])
    }

    return NextResponse.json({
      success: true,
      owner,
      repo,
      branch: targetBranch,
      files: results,
      totalFiles: allFiles.length,
      fetchedFiles: results.length,
      truncatedFiles: allFiles.length - results.length,
      tree: allFiles.map((f: any) => ({ path: f.path, size: f.size })),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch repository',
      },
      { status: 500 }
    )
  }
}
