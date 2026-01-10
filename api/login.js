const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

// Neon bağlantı linkini buraya yapıştır (Dashboard -> Connection String)
const sql = neon('postgresql://neondb_owner:SIFRE@HOST/neondb?sslmode=require');

export default async function handler(req, res) {
    // Sadece POST isteklerini kabul et
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir.' });
    }

    try {
        // AuthMe tablosundan kullanıcıyı bul
        // AuthMe genellikle kullanıcı adlarını küçük harf (lowercase) saklar
        const users = await sql('SELECT password FROM authme WHERE username = $1', [username.toLowerCase()]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Bu kullanıcı kayıtlı değil!' });
        }

        const storedHash = users[0].password; 

        // AuthMe SHA256 Formatı: $SHA$salt$hash
        const parts = storedHash.split('$');
        if (parts.length < 4) {
            return res.status(500).json({ error: 'Veritabanındaki şifre formatı uyumsuz!' });
        }

        const salt = parts[2];
        const originalHash = parts[3];

        // AuthMe'nin şifreleme algoritması (Double SHA256 + Salt):
        // hash = sha256(sha256(password) + salt)
        const firstPass = crypto.createHash('sha256').update(password).digest('hex');
        const finalHash = crypto.createHash('sha256').update(firstPass + salt).digest('hex');

        if (finalHash === originalHash) {
            // Giriş başarılı
            return res.status(200).json({ 
                success: true, 
                username: username,
                message: 'Giriş başarılı!' 
            });
        } else {
            // Şifre yanlış
            return res.status(401).json({ error: 'Şifre hatalı!' });
        }

    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ error: 'Sunucu hatası oluştu.' });
    }
}
