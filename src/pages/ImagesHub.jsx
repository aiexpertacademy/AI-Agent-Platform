import {
  Image,
  Hexagon,
  Sparkles,
  Layout,
  Globe,
  Megaphone,
  Wand2,
  ImageIcon,
} from 'lucide-react'
import ToolCard from '../components/ToolCard'
import HubHeader from '../components/HubHeader'

const tools = [
  { icon: Image, title: 'Image Generator', description: 'Create stunning images from text prompts using advanced AI image generation.', color: '#ec4899', path: '/tools/image-generator' },
  { icon: Hexagon, title: 'Logo Generator', description: 'AI-powered brand logo design with SVG, images & design brief.', color: '#f97316', path: '/tools/logo-generator' },
  { icon: Sparkles, title: 'Anime Art Maker', description: 'Transform photos or descriptions into stunning anime art.', color: '#e879f9', path: '/tools/anime-art-maker' },
  { icon: Layout, title: 'App UI/UX Designer', description: 'Generate wireframes, color palettes, components & Figma prompts.', color: '#06b6d4', path: '/tools/app-ui-designer' },
  { icon: Globe, title: 'Web Designer', description: 'Generate complete websites with live preview & instant download.', color: '#6366f1', path: '/tools/web-designer' },
  { icon: Megaphone, title: 'AI Ad Generator', description: 'Generate complete ads with AI copy, design brief & live preview.', color: '#f43f5e', path: '/tools/ad-generator' },
  { icon: Wand2, title: 'Prompt Generator', description: 'Generate optimized prompts for Midjourney, DALL-E, Sora & more.', color: '#8b5cf6', path: '/tools/prompt-generator' },
]

export default function ImagesHub() {
  return (
    <div>
      <HubHeader
        icon={ImageIcon}
        title="Image Generation"
        subtitle="Create stunning visuals, logos, UI designs, and more with AI"
        color="#ec4899"
        count={tools.length}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.title} {...tool} />
        ))}
      </div>
    </div>
  )
}
