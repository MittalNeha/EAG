// Gemini AI integration for arXiv paper analysis
class GeminiAI {
    constructor() {
        // Replace with your actual Gemini API key
        this.apiKey = 'AIzaSyAwbRKQBrc8HPwpzIKlBFv7XvjiZXdl-3o';
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    }

    async analyzeAbstract(abstract, paperTitle) {
        try {
            const prompt = `
Analyze this research paper abstract and provide:

1. A concise 2-3 sentence summary
2. Top 5 key terms that describe the main concepts
3. Research field/category
4. Technical complexity level (Beginner/Intermediate/Advanced)
5. Main research contributions

Paper Title: "${paperTitle}"
Abstract: "${abstract}"

Format your response as JSON:
{
  "summary": "Brief summary here",
  "keyTerms": ["term1", "term2", "term3", "term4", "term5"],
  "researchField": "Field name",
  "complexity": "Beginner/Intermediate/Advanced",
  "contributions": "Main contributions here"
}`;

            const response = await fetch(`${this.apiUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key: GEMINI_API_KEY',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                console.error('Gemini AI error in response: ${response.status});
                throw new Error(`Gemini API error in response: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.candidates[0].content.parts[0].text;
            
            // Try to parse JSON response
            try {
                return JSON.parse(aiResponse);
            } catch (parseError) {
                // Fallback if JSON parsing fails
                return {
                    summary: aiResponse.substring(0, 200) + "...",
                    keyTerms: ["AI", "Research", "Technology"],
                    researchField: "Computer Science",
                    complexity: "Intermediate",
                    contributions: "Novel research contributions"
                };
            }
        } catch (error) {
            console.error('Gemini AI error:', error);
            return {
                summary: "AI analysis unavailable",
                keyTerms: ["Analysis", "Failed"],
                researchField: "Unknown",
                complexity: "Unknown",
                contributions: "Unable to analyze"
            };
        }
    }

    async getPaperInsights(paper) {
        if (!paper.abstract || paper.abstract.length < 50) {
            return {
                summary: "Abstract too short for analysis",
                keyTerms: [],
                researchField: "Unknown",
                complexity: "Unknown",
                contributions: "Insufficient data"
            };
        }

        return await this.analyzeAbstract(paper.abstract, paper.paperTitle || paper.title);
    }
}

// Export for use in other files
window.GeminiAI = GeminiAI;

