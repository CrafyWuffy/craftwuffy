const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

const sql = neon('postgresql://neondb_owner:npg_1JsaBiLoHu2p@ep-empty-hat-ahm60u0r-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { username, password } = req.body;

    try {
        const user = await sql('SELECT password FROM authme WHERE username = $1', [username.toLowerCase()]);
        if (user.length === 0) return res.status(401).json({ error: 'Kullanıcı yok' });

        const storedHash = user[0].password; 
        const parts = storedHash.split('$');

        // AuthMe formatı: $SHA$salt$hash
        // parts[0] boştur, parts[1] "SHA", parts[2] salt, parts[3] hash
        if (parts.length < 4) return res.status(500).json({ error: 'Veritabanı şifre formatı uyumsuz' });

        const salt = parts[2];
        const hashFromDb = parts[3];

        // AuthMe SHA256 Algoritması: SHA256(SHA256(şifre) + salt)
        const firstHash = crypto.createHash('sha256').update(password).digest('hex');
        const finalHash = crypto.createHash('sha256').update(firstHash + salt).digest('hex');

        if (finalHash === hashFromDb) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).json({ error: 'Şifre hatalı!' });
        }
    } catch (e) {
        return res.status(500).json({ error: 'Bağlantı hatası' });
    }
}
