import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ResumeBuilder from './pages/ResumeBuilder'
import AgentsHub from './pages/AgentsHub'
import ChatPage from './pages/ChatPage'
import ImagesHub from './pages/ImagesHub'
import CodeHub from './pages/CodeHub'
import DocumentsHub from './pages/DocumentsHub'
import DataHub from './pages/DataHub'
import PlaygroundPage from './pages/PlaygroundPage'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'

// Tool pages
import AIChatbot from './pages/tools/AIChatbot'
import ImageGenerator from './pages/tools/ImageGenerator'
import CodeAssistant from './pages/tools/CodeAssistant'
import DocSummarizer from './pages/tools/DocSummarizer'
import DataAnalyzer from './pages/tools/DataAnalyzer'
import SpeechToText from './pages/tools/SpeechToText'
import VideoGenerator from './pages/tools/VideoGenerator'
import WebScraper from './pages/tools/WebScraper'
import ContentModerator from './pages/tools/ContentModerator'
import AutomationBuilder from './pages/tools/AutomationBuilder'
import KnowledgeBase from './pages/tools/KnowledgeBase'
import ContentWriter from './pages/tools/ContentWriter'
import SEOOptimizer from './pages/tools/SEOOptimizer'
import ResearchAgent from './pages/tools/ResearchAgent'
import EmailComposer from './pages/tools/EmailComposer'
import APIConnector from './pages/tools/APIConnector'
import BugDetective from './pages/tools/BugDetective'
import Translator from './pages/tools/Translator'
import CareerAdvisor from './pages/tools/CareerAdvisor'
import PromptGenerator from './pages/tools/PromptGenerator'
import LogoGenerator from './pages/tools/LogoGenerator'
import AnimeArtMaker from './pages/tools/AnimeArtMaker'
import AppUIDesigner from './pages/tools/AppUIDesigner'
import AppCodeGenerator from './pages/tools/AppCodeGenerator'
import WebDesigner from './pages/tools/WebDesigner'
import LatestNews from './pages/tools/LatestNews'
import TrendAnalyst from './pages/tools/TrendAnalyst'
import FakeNewsDetector from './pages/tools/FakeNewsDetector'
import SpamDetector from './pages/tools/SpamDetector'
import AdGenerator from './pages/tools/AdGenerator'
import AdVideoGenerator from './pages/tools/AdVideoGenerator'

function AuthRedirect({ children }) {
  const { currentUser, loading } = useAuth()
  if (loading) return null
  if (currentUser) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
      <Route path="/signup" element={<AuthRedirect><Signup /></AuthRedirect>} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="resume-builder" element={<ResumeBuilder />} />
        <Route path="agents" element={<AgentsHub />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="images" element={<ImagesHub />} />
        <Route path="code" element={<CodeHub />} />
        <Route path="documents" element={<DocumentsHub />} />
        <Route path="data" element={<DataHub />} />
        <Route path="playground" element={<PlaygroundPage />} />
        <Route path="settings" element={<Navigate to="/" replace />} />

        {/* Tool routes */}
        <Route path="tools/chatbot" element={<AIChatbot />} />
        <Route path="tools/image-generator" element={<ImageGenerator />} />
        <Route path="tools/code-assistant" element={<CodeAssistant />} />
        <Route path="tools/doc-summarizer" element={<DocSummarizer />} />
        <Route path="tools/data-analyzer" element={<DataAnalyzer />} />
        <Route path="tools/speech-to-text" element={<SpeechToText />} />
        <Route path="tools/video-generator" element={<VideoGenerator />} />
        <Route path="tools/web-scraper" element={<WebScraper />} />
        <Route path="tools/content-moderator" element={<ContentModerator />} />
        <Route path="tools/automation-builder" element={<AutomationBuilder />} />
        <Route path="tools/knowledge-base" element={<KnowledgeBase />} />
        <Route path="tools/content-writer" element={<ContentWriter />} />
        <Route path="tools/seo-optimizer" element={<SEOOptimizer />} />
        <Route path="tools/research-agent" element={<ResearchAgent />} />
        <Route path="tools/email-composer" element={<EmailComposer />} />
        <Route path="tools/api-connector" element={<APIConnector />} />
        <Route path="tools/bug-detective" element={<BugDetective />} />
        <Route path="tools/translator" element={<Translator />} />
        <Route path="tools/career-advisor" element={<CareerAdvisor />} />
        <Route path="tools/prompt-generator" element={<PromptGenerator />} />
        <Route path="tools/logo-generator" element={<LogoGenerator />} />
        <Route path="tools/anime-art-maker" element={<AnimeArtMaker />} />
        <Route path="tools/app-ui-designer" element={<AppUIDesigner />} />
        <Route path="tools/app-code-generator" element={<AppCodeGenerator />} />
        <Route path="tools/web-designer" element={<WebDesigner />} />
        <Route path="tools/latest-news" element={<LatestNews />} />
        <Route path="tools/trend-analyst" element={<TrendAnalyst />} />
        <Route path="tools/fake-news-detector" element={<FakeNewsDetector />} />
        <Route path="tools/spam-detector" element={<SpamDetector />} />
        <Route path="tools/ad-generator" element={<AdGenerator />} />
        <Route path="tools/ad-video-generator" element={<AdVideoGenerator />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
