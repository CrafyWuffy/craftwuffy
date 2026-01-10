const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_1JsaBiLoHu2p@ep-empty-hat-ahm60u0r-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'POST') {
        const { username, content } = req.body;
        if (!username || !content) return res.status(400).json({ error: 'Eksik veri' });
        try {
            await sql('INSERT INTO forum_posts (username, content) VALUES ($1, $2)', [username, content]);
            return res.status(200).json({ success: true });
        } catch (e) { return res.status(500).json({ error: e.message }); }
    } 

    if (req.method === 'GET') {
        try {
            const posts = await sql('SELECT * FROM forum_posts ORDER BY created_at DESC LIMIT 15');
            return res.status(200).json(posts);
        } catch (e) { return res.status(500).json({ error: e.message }); }
    }
}
