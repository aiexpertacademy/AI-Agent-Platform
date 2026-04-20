import { callGemini } from '../../config/gemini'

// ─── Custom template from user prompt ────────────────────────────────────────

export async function generateTemplateFromPrompt(userPrompt) {
  const prompt = `You are an expert HTML/CSS resume/CV designer. Create a stunning, complete resume template based on this style description: "${userPrompt}"

Use SAMPLE PLACEHOLDER DATA to fill every section (not a real person):
- Name: "Alex Johnson"
- Title: "Senior Product Manager"
- Contacts: alex.johnson@email.com | +1 (555) 234-5678 | New York, NY | linkedin.com/in/alexjohnson
- Work Experience:
    Product Manager at Google (2021–Present): Led cross-functional team of 12 to ship AI-powered search features; increased engagement by 34%; owned $5M product roadmap.
    Associate PM at Meta (2018–2021): Launched Stories analytics dashboard adopted by 500K+ creators; reduced churn by 18% through data-driven retention experiments.
- Education: MBA, Harvard Business School (2016–2018) | GPA 3.9, Baker Scholar
- Skills: Product Strategy, Agile/Scrum, SQL, Python, Figma, React, Data Analysis, Stakeholder Management, A/B Testing, Leadership
- Projects: AI Resume Builder (React, Node.js, OpenAI) — 2K+ active users; Portfolio Site (Next.js, Tailwind)
- Awards: Product of the Year 2023 (Google), Dean's List 4 semesters
- Languages: English (Native), Spanish (Conversational)
- Hobbies: Open-source contribution, Chess, Photography

DESIGN REQUIREMENTS:
1. Output a COMPLETE, self-contained HTML file from <!DOCTYPE html> to </html>. ALL CSS inside a <style> tag. No CDN links, no @import.
2. First line of <style> must be: :root { --accent: [your chosen accent color]; } — use var(--accent) throughout.
3. Page width: 210mm. Include @media print { body { margin: 0; } @page { size: A4; margin: 0; } }.
4. The design MUST perfectly match: "${userPrompt}" — honor every aspect of the style described.
5. Make it visually impressive and show the complete design across all sections.
6. Use only web-safe font stacks (no Google Fonts URLs).

Output ONLY the raw HTML starting with <!DOCTYPE html>. No explanation, no markdown fences.`

  let text = await callGemini(prompt, { temperature: 0.5, maxTokens: 8192 })
  if (!text) throw new Error('No template generated')

  // Strip markdown fences if present
  text = text.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  if (!text.toLowerCase().startsWith('<!doctype')) {
    const idx = text.toLowerCase().indexOf('<!doctype')
    if (idx > 0) text = text.substring(idx)
  }

  // Extract accent color from generated HTML
  const accentMatch = text.match(/--accent\s*:\s*([#\w()%,.\s]+?);/)
  const accentColor = accentMatch ? accentMatch[1].trim() : '#4a69bd'

  return { html: text, accentColor }
}

// ─── Template description builder (built-in templates) ───────────────────────

function buildTemplateDescription(template) {
  const { style } = template

  const layoutDescriptions = {
    sidebar: `TWO-COLUMN SIDEBAR LAYOUT:
  - Left sidebar (33% width): solid background color ${style.headerBg}, text ${style.headerText}. Contains photo (if provided), name in large bold font, contact info in small text, then Skills section organized by category.
  - Right main area (67% width): white/light background. Contains Summary, Work Experience, Education sections with styled section headers.`,

    timeline: `MODERNCV TIMELINE LAYOUT:
  - Full-width header at top: large name left-aligned, contact info right-aligned, separated by a thick colored rule in ${style.accentColor}.
  - Each experience entry: year range on the FAR LEFT (width ~90px) in accent color ${style.accentColor} bold, then a vertical left border line, then role title bold + company name in accent color, then bullet points indented right.
  - This horizontal timeline style must be exact — dates always on the left, content on the right of a vertical separator.`,

    'two-column': `TWO-COLUMN BODY LAYOUT:
  - Full-width header at top with name, title, and contact info.
  - Body splits into two equal columns side by side.
  - Left column: Work Experience entries.
  - Right column: Skills organized by category, then Education.`,
  }

  const layout = layoutDescriptions[style.layout] ||
    `SINGLE-COLUMN STANDARD LAYOUT:
  - Centered or left-aligned header with name (large, bold), job title, and contact info in one line separated by pipes.
  - Sections stacked vertically: Summary → Experience → Education → Skills.
  - Each section title in uppercase with colored border: ${style.sectionBorder || `2px solid ${style.accentColor}`}.`

  return `TEMPLATE: ${template.name}
CATEGORY: ${template.category}
DESCRIPTION: ${template.description}

${layout}

COLORS:
  - Accent / Primary: ${style.accentColor}
  - Header background: ${style.headerBg}
  - Header text: ${style.headerText}
  - Dark mode body: ${style.darkMode ? 'YES — body background #1a1a1a, text #e8e8e8' : 'NO — white body background, dark text'}

TYPOGRAPHY:
  - Heading font: ${style.fontFamily}
  - Body font: ${style.bodyFont}
  - Use web-safe fallbacks — do NOT use @import or external font URLs.`
}

export async function generateResumeContent(formData, template) {
  const accentColor = template.accentColor || template.style?.accentColor || '#4a69bd'

  let templateDesc
  if (template.isCustom) {
    templateDesc = `CUSTOM USER-DEFINED TEMPLATE
Style prompt: "${template.prompt}"
Accent color: ${accentColor}
Match the visual design language, layout, colors, and typography implied by the style prompt exactly.`
  } else if (template.promptStyle) {
    templateDesc = `TEMPLATE: ${template.name}
STYLE: ${template.style || ''}
LAYOUT: ${template.layout || 'single'}

${template.promptStyle}`
  } else {
    templateDesc = buildTemplateDescription(template)
  }

  const prompt = `You are an expert CV designer and writer. Create a professional, visually polished CV as a complete HTML file for the following person. Follow the exact template style described below.

━━━━━━━━━━━━━━━━━━━━━━━━
TEMPLATE STYLE: ${template.name.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━
${templateDesc}

━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━
Full Name: ${formData.fullName}
Job Title / Tagline: ${formData.jobTitle || ''}
Email: ${formData.email || ''}
Phone: ${formData.phone || ''}
Location: ${formData.location || ''}
LinkedIn: ${formData.linkedin || ''}
Portfolio/Website: ${formData.website || ''}

Professional Summary:
${formData.summary || '[No summary provided — write a generic professional summary based on the experience below]'}

WORK EXPERIENCE:
${formData.experience || '[No experience added]'}

EDUCATION:
${formData.education || '[No education added]'}

SKILLS: ${formData.skills || '[No skills added]'}
LANGUAGES: ${formData.languages || '[Not specified]'}

PROJECTS:
${formData.projects || '[None provided]'}

AWARDS & ACHIEVEMENTS:
${formData.awards || '[None provided]'}

HOBBIES/INTERESTS: ${formData.hobbies || '[Not specified]'}

${formData.photo ? 'PROFILE PHOTO: YES — embed this base64 image in an <img> tag in the appropriate position: ' + formData.photo.substring(0, 50) + '...' : 'PROFILE PHOTO: None provided — omit the photo element entirely.'}

━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━
1. Output a COMPLETE, self-contained HTML file (<!DOCTYPE html> through </html>). No external CDN links. All CSS in a <style> tag in <head>.
2. Replicate the "${template.name}" visual style EXACTLY — layout, proportions, font stacks, color accents (${accentColor}), spacing, and section order.
3. Include A4 @media print styles: body margin 0, no shadows, correct page breaks. Page width is 210mm.
4. Keep to ONE page unless the work experience genuinely warrants two pages.
5. Include ALL information provided — do not truncate or omit any section that has data. Skip sections that have "[None provided]" or "[Not specified]".
6. At the top of the <style> tag, declare: :root { --accent: ${accentColor}; } and use var(--accent) throughout so the accent color is easily customizable.
7. Enhance work experience bullet points: use strong action verbs, STAR format, quantify where context allows. Do NOT fabricate numbers — only enhance phrasing.
8. Skills section: organize into logical categories (e.g., "Languages & Frameworks", "Tools & Platforms", "Soft Skills").
9. If projects are provided: render them as a "Projects" section with project name bold, tech stack in smaller text, and 1-2 bullet points.
10. If awards/achievements provided: render as a clean "Awards & Achievements" section.
11. If languages are provided: render as a compact "Languages" section (e.g., "English (Native) • Hindi (Fluent)").
12. The HTML must look professional enough to send directly to a recruiter. Use proper spacing, hierarchy, and alignment.

Output ONLY the raw HTML — no explanation, no markdown fences, no code blocks. Start directly with <!DOCTYPE html> and end with </html>.`

  let text = await callGemini(prompt, { temperature: 0.4, maxTokens: 8192 })
  if (!text) throw new Error('No content generated')

  // Strip markdown code fences if the model wraps the output despite instructions
  text = text.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

  // Ensure it starts with a doctype
  if (!text.toLowerCase().startsWith('<!doctype')) {
    const start = text.toLowerCase().indexOf('<!doctype')
    if (start > 0) text = text.substring(start)
  }

  return text
}
