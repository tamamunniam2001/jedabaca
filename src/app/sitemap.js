import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://jedabaca.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const revalidate = 3600 // regenerate setiap 1 jam

export default async function sitemap() {
  // Static pages
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/explore`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/genres`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/authors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ]

  // Dynamic: novels/ebooks
  const { data: novels } = await supabase
    .from('novels')
    .select('slug, id, updated_at')
    .eq('publish_status', 'published')
    .order('updated_at', { ascending: false })

  const novelPages = (novels || []).map(novel => ({
    url: `${BASE_URL}/ebook/${novel.slug || novel.id}`,
    lastModified: new Date(novel.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Dynamic: chapters
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, novel_id, updated_at, novels!inner(slug, id, publish_status)')
    .eq('publish_status', 'published')
    .eq('novels.publish_status', 'published')
    .order('updated_at', { ascending: false })

  const chapterPages = (chapters || []).map(chapter => {
    const novelSlug = chapter.novels?.slug || chapter.novels?.id || chapter.novel_id
    return {
      url: `${BASE_URL}/ebook/${novelSlug}/chapter/${chapter.id}`,
      lastModified: new Date(chapter.updated_at),
      changeFrequency: 'monthly',
      priority: 0.6,
    }
  })

  // Dynamic: author profiles
  const { data: authors } = await supabase
    .from('profiles')
    .select('id, updated_at')
    .in('role', ['author', 'admin'])

  const authorPages = (authors || []).map(author => ({
    url: `${BASE_URL}/authors/${author.id}`,
    lastModified: new Date(author.updated_at || new Date()),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  // Dynamic: genre pages
  const GENRES = ['Romance', 'Fantasy', 'Thriller', 'Horror', 'Drama', 'Komedi', 'Misteri', 'Sci-Fi', 'Slice of Life', 'Lainnya']
  const genrePages = GENRES.map(genre => ({
    url: `${BASE_URL}/explore?genre=${encodeURIComponent(genre)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...novelPages, ...chapterPages, ...authorPages, ...genrePages]
}
