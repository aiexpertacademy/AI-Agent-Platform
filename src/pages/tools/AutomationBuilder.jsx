import { useState } from 'react'
import { Zap, Plus, Trash2, Play, Loader2, ArrowDown, GripVertical, Sparkles } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

const stepTypes = [
  { id: 'trigger', label: 'Trigger', color: '#eab308', options: ['On Schedule', 'On Webhook', 'On File Upload', 'On Email Received', 'On Form Submit', 'Manual'] },
  { id: 'action', label: 'Action', color: '#6366f1', options: ['Send Email', 'Call API', 'Transform Data', 'Generate Text (AI)', 'Analyze Sentiment', 'Translate Text', 'Summarize', 'Extract Data', 'Send Notification', 'Save to Database'] },
  { id: 'condition', label: 'Condition', color: '#f97316', options: ['If/Else', 'Contains Text', 'Greater Than', 'Less Than', 'Equals', 'Regex Match'] },
  { id: 'output', label: 'Output', color: '#10b981', options: ['Save File', 'Send Response', 'Log Result', 'Update Dashboard', 'Notify Slack', 'Send Webhook'] },
]

export default function AutomationBuilder() {
  const [steps, setSteps] = useState([
    { id: 1, type: 'trigger', option: 'On Schedule', config: '' },
  ])
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('My Automation')

  function addStep(typeId) {
    const type = stepTypes.find((t) => t.id === typeId)
    setSteps((prev) => [...prev, { id: Date.now(), type: typeId, option: type.options[0], config: '' }])
  }

  function removeStep(id) {
    setSteps((prev) => prev.filter((s) => s.id !== id))
  }

  function updateStep(id, field, value) {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s))
  }

  async function handleRun() {
    setLoading(true)
    setResult('')
    try {
      const workflow = steps.map((s, i) => `Step ${i + 1}: [${s.type.toUpperCase()}] ${s.option}${s.config ? ` - Config: ${s.config}` : ''}`).join('\n')

      const reply = await callGemini(
        `You are an automation workflow engine. Simulate running this workflow and provide a detailed execution log.

Workflow Name: ${name}
Steps:
${workflow}

For each step, provide:
1. Step execution status (success/warning/info)
2. What the step would do in detail
3. Sample output/data that would flow to the next step
4. Execution time estimate

Also provide:
- Overall workflow assessment
- Potential issues or improvements
- Sample code snippets for key integrations (Node.js)`,
        {
          systemInstruction: 'You are an automation expert. Simulate workflow execution with realistic outputs. Use markdown formatting.',
          maxTokens: 4096,
        }
      )
      setResult(reply)
    } catch (err) {
      setResult(`Error: ${err.message}`)
    }
    setLoading(false)
  }

  return (
    <ToolLayout icon={Zap} title="Automation Builder" description="Create automated workflows connecting multiple AI tools" color="#eab308">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Builder */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>

          {/* Workflow steps */}
          <div className="space-y-0">
            {steps.map((step, i) => {
              const type = stepTypes.find((t) => t.id === step.type)
              return (
                <div key={step.id}>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <GripVertical className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${type.color}20`, color: type.color }}>{type.label}</span>
                      <span className="text-xs text-gray-500">Step {i + 1}</span>
                      {steps.length > 1 && (
                        <button onClick={() => removeStep(step.id)} className="ml-auto p-1 text-gray-500 hover:text-red-400 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <select
                      value={step.option}
                      onChange={(e) => updateStep(step.id, 'option', e.target.value)}
                      className="w-full mb-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    >
                      {type.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <input
                      value={step.config}
                      onChange={(e) => updateStep(step.id, 'config', e.target.value)}
                      placeholder="Configuration details (optional)..."
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add step buttons */}
          <div className="flex flex-wrap gap-2">
            {stepTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => addStep(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                style={{ color: t.color }}
              >
                <Plus className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>

          <button onClick={handleRun} disabled={loading || steps.length === 0} className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {loading ? 'Simulating...' : 'Simulate Workflow'}
          </button>
        </div>

        {/* Right: Result */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-[calc(100vh-220px)]">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-300">Execution Log</span>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {result ? (
              <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{result}</div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-center">
                <div>
                  <Zap className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-sm">Build your workflow and click simulate</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
