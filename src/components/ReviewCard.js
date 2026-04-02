'use client'
import styles from './ReviewCard.module.css'

export default function ReviewCard({ review }) {
  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => i < rating ? '⭐' : '☆').join('')

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })

  const user = review.profiles || review.users

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} />
          ) : (
            <span>👤</span>
          )}
        </div>
        <div className={styles.details}>
          <h4 className={styles.username}>{user?.username || 'Pembaca Anonim'}</h4>
          <p className={styles.date}>{formatDate(review.created_at)}</p>
        </div>
      </div>
      <p className={styles.comment}>{review.content}</p>
      <div className={styles.footer}>
        <span className={styles.stars}>{renderStars(review.rating || 0)}</span>
        <span className={styles.ratingText}>{review.rating || 0}/5</span>
      </div>
    </div>
  )
}
