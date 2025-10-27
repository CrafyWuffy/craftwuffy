// Gerekli Kütüphaneler: @vercel/postgres
import { sql } from '@vercel/postgres';

// Skript'ten gelen POST isteğini işleyen fonksiyon
export default async function handler(req, res) {
  // Yalnızca POST isteklerini kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Skript'ten gelen JSON verisini al
    const { players, online } = req.body;

    // Verilerin geçerliliğini kontrol et
    if (typeof players !== 'number' || typeof online !== 'boolean') {
      return res.status(400).json({ message: 'Invalid data format.' });
    }

    // Neon veritabanında "server_status" tablosunu güncelle
    await sql`
        INSERT INTO server_status (id, online_players, is_online) 
        VALUES (1, ${players}, ${online}) 
        ON CONFLICT (id) 
        DO UPDATE SET 
            online_players = ${players}, 
            is_online = ${online},
            last_updated = NOW();
    `;

    return res.status(200).json({ message: 'Server status updated successfully.' });
  } catch (error) {
    console.error('Database update error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
