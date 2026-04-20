import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { Trash2, FileText, Clock } from 'lucide-react'

export default function SavedResumes({ onLoad }) {
  const { currentUser } = useAuth()
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchResumes() {
    if (!currentUser) return
    setLoading(true)
    try {
      const list = await api.getResumes(currentUser.uid)
      setResumes(list)
    } catch (err) {
      console.error('Failed to load resumes:', err.message)
    }
    setLoading(false)
  }

  useEffect(() => { fetchResumes() }, [currentUser])

  async function handleDelete(id) {
    try {
      await api.deleteResume(currentUser.uid, id)
      setResumes(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error('Failed to delete resume:', err.message)
    }
  }

  if (loading) return <p className="text-gray-500 text-sm">Loading saved resumes...</p>
  if (resumes.length === 0) return <p className="text-gray-500 text-sm">No saved resumes yet.</p>

  return (
    <div className="space-y-2">
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 group"
        >
          <button
            onClick={() => onLoad(resume)}
            className="flex items-center gap-3 flex-1 text-left cursor-pointer"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-sm text-white font-medium">{resume.formData?.fullName || 'Untitled'}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {resume.updatedAt ? new Date(resume.updatedAt).toLocaleDateString() : 'Unknown date'}
                {' — '}
                {resume.templateName || 'Unknown template'}
              </p>
            </div>
          </button>
          <button
            onClick={() => handleDelete(resume.id)}
            className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
