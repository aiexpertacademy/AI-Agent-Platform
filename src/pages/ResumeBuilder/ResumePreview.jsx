import { forwardRef } from 'react'

// Rendered when no resume has been generated yet — shows a live preview of raw form data
function EmptyPreview({ formData, style }) {
  const isDark = style.darkMode
  const bg = isDark ? '#1a1a1a' : '#ffffff'
  const bodyColor = isDark ? '#e0e0e0' : '#333333'
  const contactParts = [formData.email, formData.phone, formData.location, formData.linkedin, formData.website].filter(Boolean)

  return (
    <div style={{ padding: '36px 40px', fontFamily: style.bodyFont, backgroundColor: bg, color: bodyColor, minHeight: '297mm' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: style.sectionBorder || `2px solid ${style.accentColor}`, paddingBottom: '16px' }}>
        {formData.photo && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <img src={formData.photo} alt="Profile" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${style.accentColor}` }} />
          </div>
        )}
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: style.headerText !== '#ffffff' ? style.headerText : style.accentColor, margin: 0, fontFamily: style.fontFamily }}>
          {formData.fullName || 'Your Name'}
        </h1>
        {formData.jobTitle && (
          <div style={{ fontSize: '13px', color: style.accentColor, marginTop: '4px', fontStyle: 'italic' }}>{formData.jobTitle}</div>
        )}
        <div style={{ fontSize: '11px', color: '#888', marginTop: '8px', lineHeight: 1.8 }}>
          {contactParts.join('  |  ') || 'your.email@example.com  |  (555) 123-4567  |  City, State'}
        </div>
      </div>

      {/* Summary */}
      {formData.summary && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: style.accentColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: style.sectionBorder || `1px solid ${style.accentColor}`, paddingBottom: '4px', marginBottom: '8px' }}>Professional Summary</h2>
          <p style={{ fontSize: '11px', lineHeight: 1.7, color: isDark ? '#ccc' : '#555' }}>{formData.summary}</p>
        </div>
      )}

      {/* Experience */}
      {formData.experience && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: style.accentColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: style.sectionBorder || `1px solid ${style.accentColor}`, paddingBottom: '4px', marginBottom: '8px' }}>Work Experience</h2>
          <p style={{ fontSize: '11px', lineHeight: 1.7, color: isDark ? '#ccc' : '#555', whiteSpace: 'pre-wrap' }}>{formData.experience}</p>
        </div>
      )}

      {/* Education */}
      {formData.education && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: style.accentColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: style.sectionBorder || `1px solid ${style.accentColor}`, paddingBottom: '4px', marginBottom: '8px' }}>Education</h2>
          <p style={{ fontSize: '11px', lineHeight: 1.7, color: isDark ? '#ccc' : '#555', whiteSpace: 'pre-wrap' }}>{formData.education}</p>
        </div>
      )}

      {/* Skills */}
      {formData.skills && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: style.accentColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: style.sectionBorder || `1px solid ${style.accentColor}`, paddingBottom: '4px', marginBottom: '8px' }}>Skills</h2>
          <p style={{ fontSize: '11px', lineHeight: 1.7, color: isDark ? '#ccc' : '#555' }}>{formData.skills}</p>
        </div>
      )}

      {/* Projects */}
      {formData.projects && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: style.accentColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: style.sectionBorder || `1px solid ${style.accentColor}`, paddingBottom: '4px', marginBottom: '8px' }}>Projects</h2>
          <p style={{ fontSize: '11px', lineHeight: 1.7, color: isDark ? '#ccc' : '#555', whiteSpace: 'pre-wrap' }}>{formData.projects}</p>
        </div>
      )}

      {/* Awards */}
      {formData.awards && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: style.accentColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: style.sectionBorder || `1px solid ${style.accentColor}`, paddingBottom: '4px', marginBottom: '8px' }}>Awards & Achievements</h2>
          <p style={{ fontSize: '11px', lineHeight: 1.7, color: isDark ? '#ccc' : '#555', whiteSpace: 'pre-wrap' }}>{formData.awards}</p>
        </div>
      )}

      {!formData.summary && !formData.experience && !formData.skills && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#999' }}>
          <p style={{ fontSize: '14px' }}>Fill in the form and click "Generate Resume" to see your polished CV here</p>
        </div>
      )}
    </div>
  )
}

const ResumePreview = forwardRef(function ResumePreview({ formData, generated, template }, ref) {
  const style = template.style

  // If AI has generated the full HTML → display in iframe
  if (generated && typeof generated === 'string') {
    return (
      <iframe
        ref={ref}
        srcDoc={generated}
        title="Resume Preview"
        style={{
          width: '210mm',
          minHeight: '297mm',
          border: 'none',
          display: 'block',
          backgroundColor: '#ffffff',
        }}
        scrolling="no"
        onLoad={(e) => {
          // Auto-size iframe height to content
          try {
            const doc = e.target.contentDocument
            if (doc) {
              const h = doc.body.scrollHeight
              if (h > 0) e.target.style.height = h + 'px'
            }
          } catch (_) {}
        }}
      />
    )
  }

  // Otherwise show the live empty preview driven by form data
  return (
    <div
      ref={ref}
      style={{
        width: '210mm',
        minHeight: '297mm',
        backgroundColor: style.darkMode ? '#1a1a1a' : '#ffffff',
      }}
    >
      <EmptyPreview formData={formData} style={style} />
    </div>
  )
})

export default ResumePreview
