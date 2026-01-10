const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto'); // Şifre kontrolü için

const sql = neon('YOUR_NEON_CONNECTION_STRING');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { username, password } = req.body;

    try {
        // AuthMe tablosundan kullanıcıyı bul (Genelde tablo adı 'authme' olur)
        const user = await sql('SELECT password FROM authme WHERE username = $1', [username.toLowerCase()]);

        if (user.length === 0) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı!' });
        }

        const storedHash = user[0].password; // Örn: $SHA$salt$hash

        // AuthMe şifre kontrol mantığı (SHA256 örneği)
        const parts = storedHash.split('$');
        const salt = parts[2];
        const hashedInput = "$SHA$" + salt + "$" + crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest('hex') + salt).digest('hex');

        if (storedHash === hashedInput) {
            return res.status(200).json({ success: true, username: username });
        } else {
            return res.status(401).json({ error: 'Şifre yanlış!' });
        }
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
