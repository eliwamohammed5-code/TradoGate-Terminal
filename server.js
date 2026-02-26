const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors()); 
app.use(express.json());
app.use(express.static(__dirname));

// 🔑 1. YOUR MASTER KEYS (PASTE THEM HERE)
const GEMINI_API_KEY = "AIzaSyAI0yilXYKANYTzk6n6h8Jjtx0MM_K8KcU";
const SUPABASE_URL = "https://vkpsalkvczrckxfvmjis.supabase.co";
const SUPABASE_KEY = "sb_publishable_svQqHLAiy1TiNYsbzoaN3Q_1iu6LwNv";

// 🧠 2. INITIALIZE ENGINES
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", generationConfig: { responseMimeType: "application/json" } });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const parser = new Parser({
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
});

// 🔥 3. CLOUD AUTO-INJECTOR (Fires up the UI if the cloud is empty)
async function checkCloudAndInject() {
    const { count } = await supabase.from('articles').select('*', { count: 'exact', head: true });
    if (count === 0) {
        console.log("⚠️ Cloud Database Empty. Injecting Alpha Node Data...");
        await supabase.from('articles').insert([
            { category: 'MARKETS', title: '[ATUM PRIORITY] SYSTEM ONLINE: CLOUD SYNCED', summary: 'Terminal operational.', sentiment: 'BULLISH', confidence: '99.99', source: 'ATUM CLOUD' },
            { category: 'CRYPTO', title: '[ATUM PRIORITY] INSTITUTIONAL WHALE DETECTED', summary: 'Massive transfer.', sentiment: 'BULLISH', confidence: '95.50', source: 'BINANCE NODE' }
        ]);
    }
}
checkCloudAndInject();

// 🤖 4. THE AI ENGINE
async function analyzeIntel(headline, snippet) {
    try {
        const prompt = `Analyze this financial news: Headline: "${headline}" Snippet: "${snippet}". 
        Return ONLY valid JSON with 3 keys: 
        1. "sentiment" ("BULLISH", "BEARISH", or "NEUTRAL"). 
        2. "confidence" (Number between 85.00 and 99.99). 
        3. "text" (Rewrite headline like a premium terminal alert, e.g., "[ATUM PRIORITY] INTERCEPTED: <headline>").`;

        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error) {
        console.log(`⚠️ AI Warning:`, error.message);
        return { text: `[ATUM PRIORITY] ${headline.toUpperCase()}`, sentiment: "NEUTRAL", confidence: "85.00" };
    }
}

// 🕷️ 5. CLOUD-LINKED LEVIATHAN SCRAPER
async function runLeviathanScraper() {
    console.log("🕵️‍♂️ Leviathan AI scanning... Syncing to Supabase Cloud...");
   const sources = [
        { name: 'COINTELEGRAPH', category: 'CRYPTO', url: 'https://cointelegraph.com/rss' },
        { name: 'NY_POST', category: 'MARKETS', url: 'https://nypost.com/business/feed/' },
        { name: 'WSJ_NODE', category: 'ANALYSIS', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml' },
        { name: 'MACRO_INTEL', category: 'INTELLIGENCE', url: 'https://www.investing.com/rss/news_285.rss' }
    ];

    // Auto-clean old records from the cloud to save space
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    await supabase.from('articles').delete().lte('timestamp', yesterday);

    for (const source of sources) {
        try {
            const feed = await parser.parseURL(source.url);
            for (const item of feed.items.slice(0, 2)) { 
                const summaryText = item.contentSnippet || item.content || "Data encrypted.";
                
                // Check Cloud for Duplicates
                const { data: existing } = await supabase.from('articles').select('id').eq('title', item.title).maybeSingle();
                
                if (!existing) {
                    console.log(`🧠 Cloud processing: ${item.title.substring(0, 30)}...`);
                    const ai = await analyzeIntel(item.title, summaryText);
                    
                    // Insert into Cloud
                    await supabase.from('articles').insert([{
                        category: source.category, title: ai.text, summary: summaryText, 
                        sentiment: ai.sentiment, confidence: ai.confidence, source: source.name
                    }]);
                    console.log(`✅ CLOUD SECURED: ${source.name} | ${ai.sentiment}`);
                }
            }
        } catch(e) { console.log(`❌ BLOCK ON ${source.name}: ${e.message}`); }
    }
}

// 🌐 6. CLOUD API ROUTES
app.get('/api/news', async (req, res) => {
    const { data, error } = await supabase.from('articles').select('*').order('id', { ascending: false }).limit(50);
    if (error) res.status(500).json({ error: error.message });
    else res.json(data);
});

// 🚀 7. IGNITION
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n=============================================`);
    console.log(`🚀 ATUM CLOUD BRAIN: Live on http://localhost:${PORT}`);
    console.log(`=============================================\n`);
    runLeviathanScraper();
    setInterval(runLeviathanScraper, 300000); 
});

process.on('uncaughtException', (err) => console.error('CRITICAL ERROR:', err));