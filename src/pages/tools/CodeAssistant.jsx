import { useState, useRef, useEffect } from 'react'
import {
  Code2, ShieldAlert, BarChart2, Package, MessageSquare,
  Loader2, Copy, Check, Folder, GitBranch, Lock, Eye,
  Send, Search, Database, Layout, Activity,
  FileCode, GitPullRequest, GitMerge, Zap, Bug,
  ChevronRight,
} from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

// ── File tree ──────────────────────────────────────────────────────────────────
const STATUS = {
  critical: '#ef4444',
  warning:  '#f59e0b',
  info:     '#3b82f6',
  clean:    '#10b981',
}

const MOCK_FILES = [
  { name: 'index.js',                 status: 'critical', lines: 142 },
  { name: 'auth.js',                  status: 'critical', lines: 89  },
  { name: 'models/User.js',           status: 'critical', lines: 120 },
  { name: 'routes/auth.js',           status: 'critical', lines: 89  },
  { name: 'services/payment.js',      status: 'critical', lines: 145 },
  { name: 'database.js',              status: 'warning',  lines: 234 },
  { name: 'api.js',                   status: 'warning',  lines: 178 },
  { name: 'config.js',                status: 'warning',  lines: 45  },
  { name: 'routes/users.js',          status: 'warning',  lines: 156 },
  { name: 'middleware/auth.js',        status: 'warning',  lines: 45  },
  { name: 'services/storage.js',      status: 'warning',  lines: 67  },
  { name: 'tests/api.test.js',        status: 'warning',  lines: 234 },
  { name: 'package.json',             status: 'warning',  lines: 45  },
  { name: 'utils.js',                 status: 'info',     lines: 67  },
  { name: 'models/Order.js',          status: 'info',     lines: 95  },
  { name: 'middleware/cors.js',        status: 'info',     lines: 23  },
  { name: 'tests/auth.test.js',       status: 'info',     lines: 189 },
  { name: '.env.example',             status: 'info',     lines: 12  },
  { name: 'models/Product.js',        status: 'clean',    lines: 88  },
  { name: 'routes/products.js',       status: 'clean',    lines: 112 },
  { name: 'middleware/rate-limit.js', status: 'clean',    lines: 34  },
  { name: 'services/email.js',        status: 'clean',    lines: 78  },
  { name: 'README.md',                status: 'clean',    lines: 67  },
  { name: 'Dockerfile',               status: 'clean',    lines: 34  },
  { name: 'docker-compose.yml',       status: 'clean',    lines: 45  },
]

// ── Preloaded sample code (auth.js — intentionally has issues for demo) ────────
const STARTER_CODE = `// auth.js — JWT Authentication Service
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

// TODO: Move to environment variable
const SECRET_KEY = 'my-super-secret-key-123';

async function loginUser(username, password) {
  // WARNING: SQL injection vulnerability
  const query = \`SELECT * FROM users WHERE username = '\${username}'\`;
  const user = await db.query(query);

  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;

  // PII in logs — leaks email to console
  console.log(\`User logged in: \${user.email}\`);

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    SECRET_KEY,
    { expiresIn: '7d' }
  );

  return { token, user };
}

async function registerUser(data) {
  const { username, email, password } = data;
  const hashed = await bcrypt.hash(password, 10);

  // Missing input validation
  await db.query(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, hashed]
  );
}

module.exports = { loginUser, registerUser };`

// ── Tab / action definitions ───────────────────────────────────────────────────
const EDITOR_TABS = [
  { id: 'editor', label: 'Editor',     icon: FileCode      },
  { id: 'cicd',   label: 'CI/CD',       icon: GitBranch     },
  { id: 'pr',     label: 'PR Summary', icon: GitPullRequest },
  { id: 'regex',  label: 'Regex',       icon: Search        },
  { id: 'schema', label: 'DB Schema',  icon: Database      },
]

const ACTIONS = [
  { id: 'security', label: 'Security Scan',       icon: ShieldAlert, rightTab: 'security', color: '#ef4444' },
  { id: 'arch',     label: 'Architecture Review', icon: Layout,      rightTab: 'analysis', color: '#8b5cf6' },
  { id: 'bigo',     label: 'Big-O Analysis',      icon: BarChart2,   rightTab: 'analysis', color: '#6366f1' },
  { id: 'edges',    label: 'Edge Cases',           icon: Bug,         rightTab: 'tests',    color: '#10b981' },
  { id: 'deps',     label: 'Dependency Check',    icon: Package,     rightTab: 'deps',     color: '#f59e0b' },
  { id: 'license',  label: 'License Check',       icon: Lock,        rightTab: 'deps',     color: '#0ea5e9' },
  { id: 'pii',      label: 'PII Detection',        icon: Eye,         rightTab: 'security', color: '#f43f5e' },
]

const RIGHT_TABS = [
  { id: 'security', label: 'Security', icon: ShieldAlert   },
  { id: 'analysis', label: 'Analysis', icon: Activity      },
  { id: 'tests',    label: 'Tests',    icon: Bug           },
  { id: 'deps',     label: 'Deps',     icon: Package       },
  { id: 'chat',     label: 'Chat',     icon: MessageSquare },
]

// ── File list icon ─────────────────────────────────────────────────────────────
const FILE_LIST = MOCK_FILES.map(f => `${f.name} (${f.status})`).join(', ')

// ── Helpers ────────────────────────────────────────────────────────────────────
function StatusDot({ status }) {
  return <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS[status] }} />
}

function CopyBtn({ text, id, copied, onCopy }) {
  return (
    <button
      onClick={() => onCopy(text, id)}
      className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-[10px] text-gray-400 hover:text-white cursor-pointer transition-colors"
    >
      {copied === id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {copied === id ? 'Copied' : 'Copy'}
    </button>
  )
}

function ResultPane({ content, emptyIcon: EIcon, emptyTitle, copied, onCopy, copyId, monoColor = 'text-gray-300' }) {
  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 select-none">
        <EIcon className="w-10 h-10 text-gray-800 mb-3" />
        <p className="text-xs font-medium text-gray-600">{emptyTitle}</p>
        <p className="text-[10px] text-gray-700 mt-1">Run an action from the bar below the editor</p>
      </div>
    )
  }
  return (
    <div className="relative p-3">
      <div className="flex justify-end mb-2">
        <CopyBtn text={content} id={copyId} copied={copied} onCopy={onCopy} />
      </div>
      <pre className={`text-[11px] ${monoColor} font-mono leading-relaxed whitespace-pre-wrap break-words`}>{content}</pre>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CodeAssistant() {
  // Editor state
  const [activeFile, setActiveFile] = useState('auth.js')
  const [editorTab,  setEditorTab]  = useState('editor')
  const [code, setCode]             = useState(STARTER_CODE)

  // Specialized tool state
  const [cicdResult,    setCicdResult]    = useState('')
  const [prInput,       setPrInput]       = useState('')
  const [prResult,      setPrResult]      = useState('')
  const [regexInput,    setRegexInput]    = useState('')
  const [regexResult,   setRegexResult]   = useState('')
  const [schemaInput,   setSchemaInput]   = useState('')
  const [schemaResult,  setSchemaResult]  = useState('')

  // Right panel state
  const [rightTab,        setRightTab]        = useState('security')
  const [securityResult,  setSecurityResult]  = useState('')
  const [analysisResult,  setAnalysisResult]  = useState('')
  const [testsResult,     setTestsResult]     = useState('')
  const [depsResult,      setDepsResult]      = useState('')

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hi! I have full context of your 25-file Node.js repository. Ask me anything — architecture, security concerns, refactor ideas, or "what does auth.js do?"' },
  ])
  const [chatInput, setChatInput] = useState('')

  // UI state
  const [loading, setLoading] = useState(null)  // action id | 'chat' | 'tool' | null
  const [copied,  setCopied]  = useState(null)

  const chatEndRef = useRef(null)
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  function doCopy(text, id) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  // ── Action bar ─────────────────────────────────────────────────────────────
  async function runAction(action) {
    if (!code.trim() || loading) return
    setLoading(action.id)
    setRightTab(action.rightTab)

    const PROMPTS = {
      security: `Perform a thorough security audit of this code. Find: SQL injection, XSS, hardcoded secrets, PII leaks, insecure deps, weak crypto, missing validation.
For EACH issue output exactly:
[SEVERITY: CRITICAL/HIGH/MEDIUM/LOW]
Type: <vulnerability type>
Location: <function or line reference>
Issue: <what is wrong>
Fix: <concrete remediation>
---`,

      arch: `Review this code for architectural quality. Check SOLID principles, MVC separation, coupling, cohesion, design pattern misuse.
For EACH finding:
[PRINCIPLE: <name>]
Violation: <description>
Location: <class or function>
Suggestion: <specific improvement>
---`,

      bigo: `Analyze time and space complexity of every function.
For EACH function:
Function: <name>
Time Complexity: O(?) — <reasoning>
Space Complexity: O(?) — <reasoning>
Bottleneck: <yes/no + explanation>
Improvement: <suggestion if applicable>
---`,

      edges: `Write comprehensive Jest edge-case and stress tests. Cover: null/undefined, empty strings, very large inputs, unicode/emoji injection, concurrent calls, type mismatches, boundary values.
Use describe/it blocks. Comment each test with the edge case it covers. Output only executable test code.`,

      deps: `List every dependency referenced in this code. For each:
Package: <name>
Typical Version: <semver>
Status: SECURE / OUTDATED / VULNERABLE
Notes: <security issues, deprecations, or better alternatives>
---`,

      license: `Analyze license compatibility of all packages in this code.
For each:
Package: <name>
License: <SPDX identifier>
Risk: LOW / MEDIUM / HIGH
Action: <what to do — e.g., "Safe for MIT", "Replace — GPL conflict">
---`,

      pii: `Scan for PII (Personally Identifiable Information) leaks: emails in logs, passwords visible, user data in error messages, unencrypted storage.
For EACH leak:
[SEVERITY: CRITICAL/HIGH/MEDIUM/LOW]
PII Type: <what data>
Location: <function:line reference>
Leak Path: <how it leaks>
Fix: <remediation>
---`,
    }

    try {
      const reply = await callGemini(
        `${PROMPTS[action.id]}\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
        { temperature: 0.15, systemInstruction: 'You are a senior security and architecture engineer. Be precise and actionable.' }
      )
      if (action.rightTab === 'security') setSecurityResult(reply)
      else if (action.rightTab === 'analysis') setAnalysisResult(reply)
      else if (action.rightTab === 'tests')    setTestsResult(reply)
      else if (action.rightTab === 'deps')     setDepsResult(reply)
    } catch (err) {
      const msg = `Error: ${err.message}`
      if (action.rightTab === 'security') setSecurityResult(msg)
      else if (action.rightTab === 'analysis') setAnalysisResult(msg)
      else if (action.rightTab === 'tests')    setTestsResult(msg)
      else if (action.rightTab === 'deps')     setDepsResult(msg)
    }
    setLoading(null)
  }

  // ── Specialized tools ──────────────────────────────────────────────────────
  async function generateCICD() {
    setLoading('tool')
    try {
      const r = await callGemini(
        `Analyze this code and generate a complete GitHub Actions CI/CD YAML workflow.
Auto-detect runtime, test framework, build steps. Include: dependency caching, lint, test, build, and deploy stages with proper env var handling and branch rules.
Output ONLY the raw YAML — no explanation, no markdown fences.

Code:\n\`\`\`\n${code}\n\`\`\``,
        { temperature: 0.2 }
      )
      setCicdResult(r.replace(/^```ya?ml\s*/i, '').replace(/```\s*$/i, '').trim())
    } catch (err) { setCicdResult(`Error: ${err.message}`) }
    setLoading(null)
  }

  async function generatePRSummary() {
    if (!prInput.trim() && !code.trim()) return
    setLoading('tool')
    try {
      const r = await callGemini(
        `Generate a professional PR summary for a code reviewer.

## What Changed
<3-5 bullets>

## Why
<motivation>

## Impact
<security / performance / API contracts affected>

## Review Focus Areas
<what to scrutinize>

## Testing
<what was tested / what needs testing>

Tags: [security] [breaking-change] [performance] [refactor] [bugfix] [feature]

Code/Diff:\n\`\`\`\n${prInput.trim() || code}\n\`\`\``,
        { temperature: 0.4 }
      )
      setPrResult(r)
    } catch (err) { setPrResult(`Error: ${err.message}`) }
    setLoading(null)
  }

  async function explainRegex() {
    if (!regexInput.trim()) return
    setLoading('tool')
    try {
      const r = await callGemini(
        `Explain this regex: ${regexInput}

## Plain English
<what it matches>

## Component Breakdown
<each token: /^.../ = start of string, etc.>

## Passing Examples (5 strings that MATCH)
1.
2.
3.
4.
5.

## Failing Examples (5 strings that DO NOT match)
1.
2.
3.
4.
5.

## Potential Issues
<catastrophic backtracking, edge cases, recommended improvements>`,
        { temperature: 0.3 }
      )
      setRegexResult(r)
    } catch (err) { setRegexResult(`Error: ${err.message}`) }
    setLoading(null)
  }

  async function generateSchema() {
    const src = schemaInput.trim() || code
    setLoading('tool')
    try {
      const r = await callGemini(
        `Convert the classes/models in this code into a complete SQL schema.
Include: CREATE TABLE with proper types, PRIMARY KEY, FOREIGN KEY constraints, indexes for queried fields, NOT NULL where appropriate.
Output ONLY raw SQL — no explanation, no markdown fences.

Code:\n\`\`\`\n${src}\n\`\`\``,
        { temperature: 0.2 }
      )
      setSchemaResult(r.replace(/^```sql\s*/i, '').replace(/```\s*$/i, '').trim())
    } catch (err) { setSchemaResult(`Error: ${err.message}`) }
    setLoading(null)
  }

  // ── Chat ───────────────────────────────────────────────────────────────────
  async function sendChat() {
    if (!chatInput.trim() || loading === 'chat') return
    const text = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text }])
    setLoading('chat')
    try {
      const r = await callGemini(text, {
        temperature: 0.4,
        systemInstruction: `You are an expert AI code reviewer with full context of a 25-file Node.js repository.
Files: ${FILE_LIST}
Currently open file: ${activeFile}
Current code:\n\`\`\`\n${code}\n\`\`\`
Answer concisely. Reference specific files and line numbers when relevant.`,
      })
      setChatMessages(prev => [...prev, { role: 'assistant', text: r }])
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Error: ${err.message}` }])
    }
    setLoading(null)
  }

  // ── Status counts ──────────────────────────────────────────────────────────
  const counts = Object.fromEntries(
    ['critical', 'warning', 'info', 'clean'].map(s => [s, MOCK_FILES.filter(f => f.status === s).length])
  )

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <ToolLayout icon={Code2} title="AI Code Assistant" description="Full-repo analysis, security scanning, and intelligent code review" color="#10b981">
      <div
        className="flex border border-gray-800 rounded-xl overflow-hidden bg-gray-950"
        style={{ height: 'calc(100vh - 165px)' }}
      >

        {/* ════════════════════════════════════════
            LEFT SIDEBAR — Workspace / File Tree
           ════════════════════════════════════════ */}
        <div className="w-52 flex-shrink-0 border-r border-gray-800 flex flex-col min-h-0">
          {/* Header */}
          <div className="px-3 py-3 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-[11px] font-semibold text-gray-300 tracking-wider">WORKSPACE</span>
            </div>
            <p className="text-[10px] text-gray-600 mb-2.5">47 files indexed · Node.js / Jest</p>
            {/* Status legend */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {Object.entries(counts).map(([s, n]) => (
                <div key={s} className="flex items-center gap-1.5">
                  <StatusDot status={s} />
                  <span className="text-[10px] text-gray-600">{n} {s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto py-1 min-h-0">
            {MOCK_FILES.map(file => (
              <button
                key={file.name}
                onClick={() => setActiveFile(file.name)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors cursor-pointer group ${
                  activeFile === file.name
                    ? 'bg-gray-800 text-emerald-400'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900'
                }`}
              >
                <StatusDot status={file.status} />
                <span className="text-[11px] truncate font-mono flex-1">{file.name}</span>
                <span className="text-[9px] text-gray-700 flex-shrink-0">{file.lines}L</span>
              </button>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════
            CENTER — Editor + Specialized Tools
           ════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          {/* Editor tab bar */}
          <div className="flex items-center border-b border-gray-800 bg-[#0a0a12] flex-shrink-0 px-1 gap-0.5">
            {EDITOR_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setEditorTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
                  editorTab === id
                    ? 'text-emerald-400 border-emerald-500 bg-gray-950'
                    : 'text-gray-600 border-transparent hover:text-gray-400 hover:bg-gray-900/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}

            {/* Right side: file badge */}
            <div className="ml-auto flex items-center gap-2 pr-3">
              <StatusDot status={MOCK_FILES.find(f => f.name === activeFile)?.status || 'clean'} />
              <span className="text-[10px] text-gray-600 font-mono">{activeFile}</span>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden min-h-0">

            {/* ── EDITOR ── */}
            {editorTab === 'editor' && (
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full h-full px-4 py-3 bg-transparent text-emerald-300 text-xs font-mono placeholder-gray-700 focus:outline-none resize-none leading-relaxed"
                placeholder="// Paste or type your code here…"
                spellCheck={false}
              />
            )}

            {/* ── CI/CD ── */}
            {editorTab === 'cicd' && (
              <div className="h-full overflow-y-auto p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-200">GitHub Actions Generator</p>
                    <p className="text-xs text-gray-500 mt-0.5">Auto-detects Node + Jest, writes install → lint → test → build → deploy YAML</p>
                  </div>
                  <button
                    onClick={generateCICD}
                    disabled={loading === 'tool'}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
                  >
                    {loading === 'tool' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}
                    Generate YAML
                  </button>
                </div>
                {cicdResult ? (
                  <div className="relative bg-gray-900 border border-gray-800 rounded-lg">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
                      <span className="text-[10px] text-gray-500 font-mono">.github/workflows/ci.yml</span>
                      <CopyBtn text={cicdResult} id="cicd" copied={copied} onCopy={doCopy} />
                    </div>
                    <pre className="text-xs text-yellow-200 font-mono p-4 overflow-x-auto whitespace-pre leading-relaxed">{cicdResult}</pre>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 border border-dashed border-gray-800 rounded-lg">
                    <p className="text-xs text-gray-600 text-center">Click "Generate YAML" to auto-detect your stack<br />and produce a complete CI/CD pipeline</p>
                  </div>
                )}
              </div>
            )}

            {/* ── PR SUMMARY ── */}
            {editorTab === 'pr' && (
              <div className="h-full overflow-y-auto p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-200">PR Summarizer</p>
                  <p className="text-xs text-gray-500 mt-0.5">Produces a reviewer brief with tags — paste a git diff or uses the editor code</p>
                </div>
                <textarea
                  value={prInput}
                  onChange={e => setPrInput(e.target.value)}
                  rows={5}
                  placeholder="Paste git diff here (optional — uses editor code if empty)…"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  spellCheck={false}
                />
                <button
                  onClick={generatePRSummary}
                  disabled={loading === 'tool'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading === 'tool' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitPullRequest className="w-3.5 h-3.5" />}
                  Generate PR Summary
                </button>
                {prResult && (
                  <div className="relative bg-gray-900 border border-gray-800 rounded-lg">
                    <div className="flex justify-end px-3 py-2 border-b border-gray-800">
                      <CopyBtn text={prResult} id="pr" copied={copied} onCopy={doCopy} />
                    </div>
                    <pre className="text-xs text-gray-300 font-mono p-4 whitespace-pre-wrap leading-relaxed">{prResult}</pre>
                  </div>
                )}
              </div>
            )}

            {/* ── REGEX ── */}
            {editorTab === 'regex' && (
              <div className="h-full overflow-y-auto p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-200">Regex Explainer</p>
                  <p className="text-xs text-gray-500 mt-0.5">Plain English breakdown + passing/failing test strings + backtracking warnings</p>
                </div>
                <div className="flex gap-2">
                  <input
                    value={regexInput}
                    onChange={e => setRegexInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && explainRegex()}
                    placeholder="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-emerald-300 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    spellCheck={false}
                  />
                  <button
                    onClick={explainRegex}
                    disabled={loading === 'tool' || !regexInput.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {loading === 'tool' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Explain
                  </button>
                </div>

                {/* Quick-pick examples */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Email', val: '^[\\w.-]+@[\\w-]+\\.[a-z]{2,}$' },
                    { label: 'Phone E.164', val: '^\\+?[1-9]\\d{1,14}$' },
                    { label: 'Strong password', val: '^(?=.*[A-Z])(?=.*\\d).{8,}$' },
                    { label: 'URL', val: '^https?:\\/\\/(www\\.)?[\\w@:%._+~#=]{1,256}\\.[a-z]{2,6}' },
                    { label: 'IPv4', val: '^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$' },
                  ].map(({ label, val }) => (
                    <button
                      key={label}
                      onClick={() => setRegexInput(val)}
                      className="px-2 py-1 bg-gray-900 border border-gray-800 hover:border-emerald-600 text-gray-500 hover:text-gray-300 text-[10px] rounded cursor-pointer transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {regexResult && (
                  <div className="relative bg-gray-900 border border-gray-800 rounded-lg">
                    <div className="flex justify-end px-3 py-2 border-b border-gray-800">
                      <CopyBtn text={regexResult} id="regex" copied={copied} onCopy={doCopy} />
                    </div>
                    <pre className="text-xs text-gray-300 font-mono p-4 whitespace-pre-wrap leading-relaxed">{regexResult}</pre>
                  </div>
                )}
              </div>
            )}

            {/* ── DB SCHEMA ── */}
            {editorTab === 'schema' && (
              <div className="h-full overflow-y-auto p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-200">DB Schema Generator</p>
                  <p className="text-xs text-gray-500 mt-0.5">Converts detected classes into full SQL with indexes and foreign keys</p>
                </div>
                <textarea
                  value={schemaInput}
                  onChange={e => setSchemaInput(e.target.value)}
                  rows={5}
                  placeholder="Paste model/class code here (optional — uses editor code if empty)…"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  spellCheck={false}
                />
                <button
                  onClick={generateSchema}
                  disabled={loading === 'tool'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {loading === 'tool' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                  Generate SQL Schema
                </button>
                {schemaResult && (
                  <div className="relative bg-gray-900 border border-gray-800 rounded-lg">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
                      <span className="text-[10px] text-gray-500 font-mono">schema.sql</span>
                      <CopyBtn text={schemaResult} id="schema" copied={copied} onCopy={doCopy} />
                    </div>
                    <pre className="text-xs text-blue-300 font-mono p-4 overflow-x-auto whitespace-pre leading-relaxed">{schemaResult}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Action bar ── */}
          <div className="flex-shrink-0 border-t border-gray-800 bg-[#0a0a12] px-3 py-2">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-semibold text-gray-700 tracking-wider flex-shrink-0">ANALYZE →</span>
              {ACTIONS.map(({ id, label, icon: Icon, color, rightTab: rTab }) => (
                <button
                  key={id}
                  onClick={() => runAction({ id, rightTab: rTab })}
                  disabled={!!loading || !code.trim()}
                  title={label}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0 cursor-pointer disabled:opacity-40 whitespace-nowrap"
                  style={{
                    background: `${color}15`,
                    border: `1px solid ${color}30`,
                    color,
                  }}
                >
                  {loading === id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Icon className="w-3 h-3" />
                  }
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            RIGHT PANEL — Results + Chat
           ════════════════════════════════════════ */}
        <div className="w-72 flex-shrink-0 border-l border-gray-800 flex flex-col min-h-0">

          {/* Right tab bar */}
          <div className="flex border-b border-gray-800 flex-shrink-0">
            {RIGHT_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setRightTab(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                  rightTab === id
                    ? 'text-emerald-400 border-emerald-500'
                    : 'text-gray-700 border-transparent hover:text-gray-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Result content */}
          <div className="flex-1 overflow-hidden min-h-0">

            {rightTab === 'security' && (
              <div className="h-full overflow-y-auto">
                <ResultPane
                  content={securityResult}
                  emptyIcon={ShieldAlert}
                  emptyTitle="No security scan yet"
                  copied={copied}
                  onCopy={doCopy}
                  copyId="security"
                />
              </div>
            )}

            {rightTab === 'analysis' && (
              <div className="h-full overflow-y-auto">
                <ResultPane
                  content={analysisResult}
                  emptyIcon={BarChart2}
                  emptyTitle="No analysis yet"
                  copied={copied}
                  onCopy={doCopy}
                  copyId="analysis"
                />
              </div>
            )}

            {rightTab === 'tests' && (
              <div className="h-full overflow-y-auto">
                <ResultPane
                  content={testsResult}
                  emptyIcon={Bug}
                  emptyTitle="No edge-case tests yet"
                  copied={copied}
                  onCopy={doCopy}
                  copyId="tests"
                  monoColor="text-emerald-300"
                />
              </div>
            )}

            {rightTab === 'deps' && (
              <div className="h-full overflow-y-auto">
                <ResultPane
                  content={depsResult}
                  emptyIcon={Package}
                  emptyTitle="No dependency check yet"
                  copied={copied}
                  onCopy={doCopy}
                  copyId="deps"
                />
              </div>
            )}

            {rightTab === 'chat' && (
              <div className="flex flex-col h-full min-h-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[92%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-emerald-700 text-white rounded-br-sm'
                            : 'bg-gray-800 text-gray-300 rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {loading === 'chat' && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 rounded-xl rounded-bl-sm px-3 py-2.5">
                        <div className="flex gap-1 items-center">
                          {[0, 1, 2].map(i => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                              style={{ animationDelay: `${i * 150}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Repo context badge */}
                <div className="flex-shrink-0 px-3 py-1.5 border-t border-gray-800 bg-gray-900/50">
                  <p className="text-[10px] text-gray-700">
                    <span className="text-emerald-700">◉</span> Repo-aware · 25 files · {activeFile} open
                  </p>
                </div>

                {/* Input */}
                <div className="flex-shrink-0 border-t border-gray-800 p-2 flex gap-1.5">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                    placeholder="Ask about the repo…"
                    className="flex-1 px-2.5 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={sendChat}
                    disabled={!chatInput.trim() || loading === 'chat'}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
