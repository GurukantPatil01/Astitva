const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export const aiService = {
    /**
     * Get financial insights from Gemini
     */
    getInsights: async (expenses, members, group) => {
        if (!GEMINI_API_KEY) {
            return null; // Don't call if no key
        }

        const summary = {
            total: expenses.reduce((s, e) => s + parseFloat(e.converted_amount || e.amount), 0),
            count: expenses.length,
            categories: {},
            members: members.length
        };

        expenses.forEach(e => {
            const cat = e.category || 'Others';
            summary.categories[cat] = (summary.categories[cat] || 0) + parseFloat(e.converted_amount || e.amount);
        });

        const prompt = `
            Analyze this group expense data and provide 3 short, punchy, actionable financial insights. 
            Group Name: ${group.name}
            Total Amount: ${summary.total}
            Categories: ${JSON.stringify(summary.categories)}
            Members: ${summary.members}
            
            Format as a JSON array of strings. Keep it friendly and expert.
        `;

        try {
            const res = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await res.json();
            const text = data.candidates[0].content.parts[0].text;
            
            // Extract JSON array from Markdown if needed
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return [text];
        } catch (err) {
            console.error('Gemini Insights Error:', err);
            return null;
        }
    }
};
