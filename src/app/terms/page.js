import styles from './page.module.css'

export const metadata = {
  title: 'Syarat Penggunaan - Jeda Baca',
}

export default function TermsPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.label}>Legal</p>
          <h1 className={styles.title}>Syarat Penggunaan</h1>
          <p className={styles.updated}>Terakhir diperbarui: 1 Januari 2025</p>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Penerimaan Syarat</h2>
            <p>Dengan mengakses dan menggunakan platform Jeda Baca, Anda menyetujui untuk terikat oleh syarat dan ketentuan penggunaan ini. Jika Anda tidak menyetujui syarat ini, harap tidak menggunakan layanan kami.</p>
          </section>

          <section className={styles.section}>
            <h2>2. Deskripsi Layanan</h2>
            <p>Jeda Baca adalah platform digital untuk membaca dan berbagi karya sastra berupa novel dan cerita pendek dalam bahasa Indonesia. Kami menyediakan ruang bagi penulis untuk menerbitkan karya dan bagi pembaca untuk menikmatinya.</p>
          </section>

          <section className={styles.section}>
            <h2>3. Akun Pengguna</h2>
            <p>Untuk mengakses fitur tertentu, Anda perlu membuat akun. Anda bertanggung jawab untuk:</p>
            <ul>
              <li>Menjaga kerahasiaan kata sandi akun Anda</li>
              <li>Semua aktivitas yang terjadi di bawah akun Anda</li>
              <li>Memberikan informasi yang akurat dan terkini</li>
              <li>Segera memberitahu kami jika terjadi penggunaan akun yang tidak sah</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Konten Pengguna</h2>
            <p>Sebagai penulis di platform kami, Anda menyatakan bahwa:</p>
            <ul>
              <li>Anda adalah pemilik sah dari karya yang diunggah</li>
              <li>Karya Anda tidak melanggar hak cipta pihak lain</li>
              <li>Konten tidak mengandung unsur SARA, pornografi, atau kekerasan berlebihan</li>
              <li>Anda memberikan Jeda Baca lisensi non-eksklusif untuk menampilkan karya Anda di platform</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>5. Hak Kekayaan Intelektual</h2>
            <p>Seluruh konten yang diterbitkan di Jeda Baca tetap menjadi hak milik penulis masing-masing. Platform Jeda Baca, termasuk desain, logo, dan kode, adalah milik tim Jeda Baca dan dilindungi oleh hukum hak cipta.</p>
          </section>

          <section className={styles.section}>
            <h2>6. Larangan Penggunaan</h2>
            <p>Anda dilarang menggunakan platform ini untuk:</p>
            <ul>
              <li>Menyebarkan konten yang melanggar hukum atau merugikan pihak lain</li>
              <li>Melakukan spam atau aktivitas yang mengganggu pengguna lain</li>
              <li>Mencoba mengakses sistem secara tidak sah</li>
              <li>Menyalin atau mendistribusikan konten tanpa izin penulis</li>
              <li>Menggunakan bot atau alat otomatis tanpa izin tertulis</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>7. Penghentian Layanan</h2>
            <p>Kami berhak menangguhkan atau menghentikan akun Anda jika terbukti melanggar syarat penggunaan ini, tanpa pemberitahuan sebelumnya. Anda juga dapat menghapus akun Anda kapan saja melalui halaman pengaturan profil.</p>
          </section>

          <section className={styles.section}>
            <h2>8. Perubahan Syarat</h2>
            <p>Kami dapat memperbarui syarat penggunaan ini sewaktu-waktu. Perubahan akan diberitahukan melalui email atau notifikasi di platform. Penggunaan berkelanjutan setelah perubahan dianggap sebagai penerimaan syarat baru.</p>
          </section>

          <section className={styles.section}>
            <h2>9. Hubungi Kami</h2>
            <p>Jika Anda memiliki pertanyaan mengenai syarat penggunaan ini, silakan hubungi kami melalui Instagram <a href="https://www.instagram.com/jeda.renung/" target="_blank" rel="noopener noreferrer">@jeda.renung</a>.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
