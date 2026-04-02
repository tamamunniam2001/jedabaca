import styles from './page.module.css'

export const metadata = {
  title: 'Kebijakan Privasi - Jeda Baca',
}

export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.label}>Legal</p>
          <h1 className={styles.title}>Kebijakan Privasi</h1>
          <p className={styles.updated}>Terakhir diperbarui: 1 Januari 2025</p>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Informasi yang Kami Kumpulkan</h2>
            <p>Kami mengumpulkan informasi berikut saat Anda menggunakan Jeda Baca:</p>
            <ul>
              <li><strong>Informasi akun:</strong> nama, alamat email, dan kata sandi terenkripsi saat Anda mendaftar</li>
              <li><strong>Informasi profil:</strong> nama pengguna, foto profil, dan bio yang Anda tambahkan secara sukarela</li>
              <li><strong>Data penggunaan:</strong> novel yang dibaca, bookmark, komentar, dan rating yang Anda berikan</li>
              <li><strong>Data teknis:</strong> alamat IP, jenis browser, dan perangkat yang digunakan</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>2. Cara Kami Menggunakan Informasi</h2>
            <p>Informasi yang dikumpulkan digunakan untuk:</p>
            <ul>
              <li>Menyediakan dan meningkatkan layanan platform</li>
              <li>Mengelola akun dan autentikasi pengguna</li>
              <li>Menampilkan rekomendasi novel yang relevan</li>
              <li>Mengirim notifikasi penting terkait akun Anda</li>
              <li>Mencegah penyalahgunaan dan menjaga keamanan platform</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. Penyimpanan Data</h2>
            <p>Data Anda disimpan secara aman menggunakan layanan Supabase yang berstandar keamanan tinggi. Kami menerapkan enkripsi untuk data sensitif dan membatasi akses hanya kepada pihak yang berwenang.</p>
          </section>

          <section className={styles.section}>
            <h2>4. Berbagi Data dengan Pihak Ketiga</h2>
            <p>Kami tidak menjual atau menyewakan data pribadi Anda kepada pihak ketiga. Data hanya dapat dibagikan dalam kondisi berikut:</p>
            <ul>
              <li>Dengan persetujuan eksplisit dari Anda</li>
              <li>Untuk memenuhi kewajiban hukum yang berlaku</li>
              <li>Kepada penyedia layanan teknis yang membantu operasional platform (dengan perjanjian kerahasiaan)</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>5. Cookie dan Teknologi Pelacakan</h2>
            <p>Kami menggunakan cookie untuk menjaga sesi login Anda dan meningkatkan pengalaman pengguna. Anda dapat menonaktifkan cookie melalui pengaturan browser, namun beberapa fitur mungkin tidak berfungsi optimal.</p>
          </section>

          <section className={styles.section}>
            <h2>6. Hak Anda</h2>
            <p>Anda memiliki hak untuk:</p>
            <ul>
              <li>Mengakses data pribadi yang kami simpan tentang Anda</li>
              <li>Memperbarui atau mengoreksi informasi yang tidak akurat</li>
              <li>Menghapus akun dan data Anda dari platform</li>
              <li>Mengajukan keberatan atas pemrosesan data tertentu</li>
            </ul>
            <p>Untuk menggunakan hak-hak ini, hubungi kami melalui Instagram <a href="https://www.instagram.com/jeda.renung/" target="_blank" rel="noopener noreferrer">@jeda.renung</a>.</p>
          </section>

          <section className={styles.section}>
            <h2>7. Keamanan Data</h2>
            <p>Kami mengambil langkah-langkah teknis dan organisasi yang wajar untuk melindungi data Anda dari akses tidak sah, kehilangan, atau pengungkapan. Namun, tidak ada sistem yang 100% aman, dan kami tidak dapat menjamin keamanan absolut.</p>
          </section>

          <section className={styles.section}>
            <h2>8. Privasi Anak-Anak</h2>
            <p>Layanan kami tidak ditujukan untuk anak-anak di bawah usia 13 tahun. Kami tidak secara sengaja mengumpulkan data dari anak-anak. Jika Anda mengetahui bahwa anak di bawah umur telah memberikan data kepada kami, harap hubungi kami segera.</p>
          </section>

          <section className={styles.section}>
            <h2>9. Perubahan Kebijakan</h2>
            <p>Kebijakan privasi ini dapat diperbarui sewaktu-waktu. Kami akan memberitahu Anda melalui email atau notifikasi di platform jika ada perubahan signifikan.</p>
          </section>

          <section className={styles.section}>
            <h2>10. Hubungi Kami</h2>
            <p>Untuk pertanyaan atau kekhawatiran terkait privasi, silakan hubungi kami melalui Instagram <a href="https://www.instagram.com/jeda.renung/" target="_blank" rel="noopener noreferrer">@jeda.renung</a>.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
