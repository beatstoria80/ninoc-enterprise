export async function getStylistRecommendations(userPreference: string) {
  try {
    const response = await fetch('/api/ai/stylist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preference: userPreference }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from AI stylist API');
    }

    return await response.json();
  } catch (error) {
    console.error("AI Stylist API error:", error);
    return null;
  }
}
