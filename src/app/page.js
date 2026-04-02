import { createClient } from '@supabase/supabase-js'
import NovelCard from '@/components/NovelCard'
import NovelListClient from '@/components/NovelListClient'
import styles from './page.module.css'

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const revalidate = 300 // revalidate setiap 5 menit

export default async function HomePage() {
  // Fetch data di server — tidak perlu tunggu JS di browser
  const [{ data: recommended }, { data: novels, count }] = await Promise.all([
    supabaseServer.from('novels')
      .select('id, title, slug, cover_image_url, author, genre, rating, publish_status, profiles!author_id(full_name, username)')
      .eq('publish_status', 'published')
      .order('rating', { ascending: false })
      .limit(6),
    supabaseServer.from('novels')
      .select('id, title, slug, cover_image_url, author, genre, rating, publish_status, profiles!author_id(full_name, username)', { count: 'exact' })
      .eq('publish_status', 'published')
      .order('created_at', { ascending: false })
      .range(0, 11),
  ])

  return (
    <main className={styles.main}>
      {/* Rekomendasi — SSR */}
      {recommended?.length > 0 && (
        <section className={styles.recSection}>
          <div className={styles.container}>
            <div className={styles.header}>
              <h2 className={styles.sectionTitle}>Rekomendasi</h2>
              <p className={styles.sectionSubtitle}>E-book terpopuler minggu ini</p>
            </div>
            <div className={styles.grid}>
              {recommended.map((novel, i) => (
                <NovelCard key={novel.id} novel={novel} priority={i < 3} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Novel List — SSR untuk halaman pertama, client untuk pagination */}
      <NovelListClient initialNovels={novels || []} initialTotal={count || 0} />
    </main>
  )
}
