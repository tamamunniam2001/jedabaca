'use client'
import Link from 'next/link'
import Image from 'next/image'
import styles from './NovelCard.module.css'

export default function NovelCard({ novel, priority = false }) {
  const slug = novel.slug || novel.id
  return (
    <Link href={`/ebook/${slug}`} className={styles.card}>
      <div className={styles.cover}>
        {novel.cover_image_url ? (
          <Image
            src={novel.cover_image_url}
            alt={novel.title}
            fill
            sizes="(max-width: 480px) 33vw, (max-width: 640px) 25vw, (max-width: 1024px) 20vw, 160px"
            className={styles.image}
            priority={priority}
            quality={65}
          />
        ) : (
          <div className={styles.placeholder}>
            <span>{novel.title?.[0] || '?'}</span>
          </div>
        )}
        {novel.publish_status === 'draft' && (
          <span className={styles.draftBadge}>Draf</span>
        )}
      </div>
      <div className={styles.info}>
        <p className={styles.genre}>{novel.genre || 'Umum'}</p>
        <h3 className={styles.title}>{novel.title}</h3>
        <p className={styles.author}>{novel.profiles?.full_name || novel.profiles?.username || novel.author}</p>
        {novel.rating > 0 && (
          <div className={styles.rating}>
            <svg viewBox="0 0 12 12" className={styles.star}>
              <path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4z" fill="currentColor"/>
            </svg>
            <span>{Number(novel.rating).toFixed(1)}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
