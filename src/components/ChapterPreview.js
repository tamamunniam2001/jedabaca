'use client'
import styles from './ChapterPreview.module.css'

export default function ChapterPreview({ novel, chapter, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <span className={styles.previewBadge}>Pratinjau</span>
            <span className={styles.modalTitle}>Tampilan saat diterbitkan</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          {/* Chapter Header */}
          <div className={styles.chapterHeader}>
            <p className={styles.novelName}>{novel?.title || 'Judul Novel'}</p>
            <h1 className={styles.chapterTitle}>
              Bab {chapter.chapter_number}: {chapter.title || 'Judul Bab'}
            </h1>
          </div>

          {/* Chapter Content */}
          <article
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: chapter.content || '<p><em>Belum ada isi bab.</em></p>' }}
          />
        </div>
      </div>
    </div>
  )
}
