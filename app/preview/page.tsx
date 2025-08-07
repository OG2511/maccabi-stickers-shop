import { HomepagePreview } from "@/components/homepage-preview"

export default function PreviewPage() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="border-4 border-gray-300 rounded-lg overflow-hidden shadow-2xl">
        <HomepagePreview />
      </div>
    </div>
  )
}
