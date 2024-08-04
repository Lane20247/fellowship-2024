import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { pantryItems } = req.body;

    try {
      const response = await openai.completions.create({
        model: 'text-davinci-003',
        prompt: `Given the following ingredients: ${pantryItems.join(', ')}, suggest a recipe.`,
        max_tokens: 150,
      });

      res.status(200).json({ recipe: response.choices[0].text.trim() });
    } catch (error) {
      console.error('Error fetching recipe suggestions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
