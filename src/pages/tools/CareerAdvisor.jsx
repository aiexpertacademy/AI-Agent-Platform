import { useState } from 'react'
import { Compass, Loader2, ChevronDown, ChevronUp, Briefcase, GraduationCap, Target, TrendingUp, Star, BookOpen, Award, ArrowRight, Sparkles, RotateCcw } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

const experienceLevels = ['Student / Fresher', '0-2 Years', '3-5 Years', '6-10 Years', '10+ Years', 'Career Changer']
const industries = ['Technology', 'Finance', 'Healthcare', 'Education', 'Marketing', 'Design', 'Data Science', 'Engineering', 'Business', 'Other']

function ExpandableCard({ icon: Icon, title, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-all hover:border-gray-700">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-left"
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        <span className="flex-1 text-sm font-semibold text-white">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="px-5 pb-5 pt-0">{children}</div>}
    </div>
  )
}

function StepCard({ number, title, description, duration }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {number}
        </div>
        <div className="w-px flex-1 bg-gray-800 mt-1" />
      </div>
      <div className="pb-5">
        <h4 className="text-sm font-medium text-white">{title}</h4>
        {duration && <span className="text-[11px] text-emerald-400 font-medium">{duration}</span>}
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function SkillBadge({ skill, priority }) {
  const colors = {
    high: 'bg-red-500/15 text-red-400 border-red-500/20',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    low: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  }
  return (
    <div className={`px-3 py-2 rounded-lg border text-xs ${colors[priority] || colors.medium}`}>
      <span className="font-medium">{skill}</span>
      {priority && <span className="ml-1.5 opacity-60 capitalize">({priority})</span>}
    </div>
  )
}

function JobCard({ title, level, salary, match }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3.5 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-medium text-white">{title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{level}</p>
        </div>
        {match && (
          <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full flex-shrink-0">
            {match}% match
          </span>
        )}
      </div>
      {salary && <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {salary}</p>}
    </div>
  )
}

export default function CareerAdvisor() {
  const [skills, setSkills] = useState('')
  const [experience, setExperience] = useState('3-5 Years')
  const [industry, setIndustry] = useState('Technology')
  const [goals, setGoals] = useState('')
  const [education, setEducation] = useState('')
  const [loading, setLoading] = useState(false)
  const [roadmap, setRoadmap] = useState(null)
  const [error, setError] = useState('')

  async function handleGenerate(e) {
    e.preventDefault()
    if (!skills.trim() || !goals.trim()) return
    setLoading(true)
    setRoadmap(null)
    setError('')

    try {
      const reply = await callGemini(
        `You are an expert career advisor. Analyze this person's profile and create a detailed, personalized career roadmap.

PROFILE:
- Current Skills: ${skills}
- Experience Level: ${experience}
- Industry: ${industry}
- Career Goals: ${goals}
${education ? `- Education: ${education}` : ''}

Return a JSON object (no markdown, no code fences) with this exact structure:
{
  "summary": "A 2-3 sentence personalized career assessment",
  "currentStrengths": ["strength1", "strength2", "strength3"],
  "roadmapSteps": [
    {
      "step": 1,
      "title": "Step title",
      "description": "Detailed description of what to do",
      "duration": "e.g., 1-3 months"
    }
  ],
  "skillsToLearn": [
    { "skill": "Skill name", "priority": "high/medium/low", "reason": "Why this skill matters" }
  ],
  "targetJobs": [
    {
      "title": "Job Title",
      "level": "Junior/Mid/Senior/Lead",
      "salary": "Estimated salary range",
      "match": 85,
      "description": "Brief description of role fit"
    }
  ],
  "resources": [
    { "name": "Resource name", "type": "Course/Book/Certification/Platform", "url": "" }
  ],
  "milestones": [
    { "timeframe": "3 months", "goal": "What to achieve by this point" },
    { "timeframe": "6 months", "goal": "What to achieve" },
    { "timeframe": "1 year", "goal": "What to achieve" },
    { "timeframe": "2 years", "goal": "What to achieve" }
  ]
}

Generate 5-8 roadmap steps, 6-10 skills to learn, 4-6 target jobs, 4-6 resources, and 4 milestones. Be specific and actionable. Tailor everything to the person's actual skills and goals.`,
        {
          systemInstruction: 'You are a world-class career advisor. Return only valid JSON with no extra text or markdown formatting.',
          temperature: 0.7,
          maxTokens: 6144,
        }
      )

      const cleaned = reply.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setRoadmap(parsed)
    } catch (err) {
      setError(`Failed to generate roadmap: ${err.message}`)
    }
    setLoading(false)
  }

  function handleReset() {
    setRoadmap(null)
    setError('')
  }

  return (
    <ToolLayout icon={Compass} title="Career Advisor" description="Get a personalized AI-powered career roadmap" color="#f59e0b">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Form */}
        <div className="space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Current Skills
              </label>
              <textarea
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                placeholder="e.g., JavaScript, React, Node.js, SQL, Git, basic Python..."
              />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-400" /> Experience Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {experienceLevels.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperience(lvl)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        experience === lvl ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                <div className="flex flex-wrap gap-2">
                  {industries.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setIndustry(ind)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        industry === ind ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" /> Career Goals
              </label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                placeholder="e.g., Become a senior full-stack developer, transition to AI/ML engineering, get into a FAANG company..."
              />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-400" /> Education <span className="text-xs text-gray-500">(optional)</span>
              </label>
              <input
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="e.g., B.Tech in Computer Science"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !skills.trim() || !goals.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? 'Building Your Roadmap...' : 'Generate Career Roadmap'}
            </button>
          </form>

          {roadmap && (
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Start Over
            </button>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {loading && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Analyzing your profile and building a roadmap...</p>
                <p className="text-xs text-gray-600 mt-1">This takes a few seconds</p>
              </div>
            </div>
          )}

          {!roadmap && !loading && !error && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-96">
              <div className="text-center text-gray-500">
                <Compass className="w-16 h-16 mx-auto mb-3 text-gray-600" />
                <p className="text-sm">Your personalized career roadmap will appear here</p>
                <p className="text-xs text-gray-600 mt-2">Enter your skills, experience, and goals to get started</p>
              </div>
            </div>
          )}

          {roadmap && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-amber-600/10 to-orange-600/10 border border-amber-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-amber-300">Career Assessment</h3>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">{roadmap.summary}</p>
                {roadmap.currentStrengths?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {roadmap.currentStrengths.map((s, i) => (
                      <span key={i} className="text-xs bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Roadmap Steps */}
              <ExpandableCard icon={ArrowRight} title={`Career Roadmap — ${roadmap.roadmapSteps?.length || 0} Steps`} color="#10b981" defaultOpen>
                <div className="mt-1">
                  {roadmap.roadmapSteps?.map((step) => (
                    <StepCard key={step.step} number={step.step} title={step.title} description={step.description} duration={step.duration} />
                  ))}
                </div>
              </ExpandableCard>

              {/* Skills to Learn */}
              <ExpandableCard icon={BookOpen} title={`Skills to Learn — ${roadmap.skillsToLearn?.length || 0} Skills`} color="#f59e0b" defaultOpen>
                <div className="space-y-3 mt-1">
                  <div className="flex flex-wrap gap-2">
                    {roadmap.skillsToLearn?.map((s, i) => (
                      <SkillBadge key={i} skill={s.skill} priority={s.priority} />
                    ))}
                  </div>
                  <div className="space-y-2 mt-3">
                    {roadmap.skillsToLearn?.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          s.priority === 'high' ? 'bg-red-400' : s.priority === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                        }`} />
                        <span className="text-gray-400"><span className="text-gray-200 font-medium">{s.skill}:</span> {s.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ExpandableCard>

              {/* Target Jobs */}
              <ExpandableCard icon={Briefcase} title={`Target Job Titles — ${roadmap.targetJobs?.length || 0} Roles`} color="#6366f1" defaultOpen>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  {roadmap.targetJobs?.map((job, i) => (
                    <JobCard key={i} {...job} />
                  ))}
                </div>
              </ExpandableCard>

              {/* Milestones */}
              <ExpandableCard icon={Target} title="Milestones & Timeline" color="#ec4899">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
                  {roadmap.milestones?.map((m, i) => (
                    <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 text-center">
                      <span className="text-lg font-bold text-pink-400">{m.timeframe}</span>
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{m.goal}</p>
                    </div>
                  ))}
                </div>
              </ExpandableCard>

              {/* Resources */}
              <ExpandableCard icon={Award} title={`Recommended Resources — ${roadmap.resources?.length || 0}`} color="#14b8a6">
                <div className="space-y-2 mt-1">
                  {roadmap.resources?.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">{r.name}</h4>
                        <span className="text-[11px] text-gray-500">{r.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ExpandableCard>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
