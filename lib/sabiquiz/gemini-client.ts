// lib/sabiquiz/gemini-client.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY!

if (!API_KEY) {
  throw new Error('Missing NEXT_PUBLIC_GEMINI_API_KEY in environment variables')
}

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(API_KEY)

// Use Gemini 2.0 Flash Lite (fastest & most cost-effective)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-lite',
})

/**
 * Generate content using Gemini API
 * Cost: ~$0.001 per 10-question generation (extremely cheap!)
 */
export async function generateContent(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    })
    
    const response = await result.response
    return response.text()
  } catch (error: any) {
    console.error('Gemini API error:', error)
    
    // Better error messages
    if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      throw new Error('Invalid Gemini API key. Please check your .env.local file.')
    }
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      throw new Error('API quota exceeded. Please try again later.')
    }
    if (error.message?.includes('blocked') || error.message?.includes('safety')) {
      throw new Error('Content was blocked by safety filters. Try different material.')
    }
    if (error.status === 404) {
      throw new Error('Model not found. Your API key may not have access to this model.')
    }
    
    throw new Error(`AI generation failed: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Extract JSON from Gemini response
 */
export function extractJSON<T>(response: string): T {
  try {
    let cleaned = response.trim()
    
    // Remove markdown code blocks
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }
    
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('JSON parsing error:', error)
    console.error('Response:', response)
    throw new Error('Failed to parse AI response. The AI did not return valid JSON.')
  }
}

/**
 * Test API key and connection
 */
export async function testConnection(): Promise<{ success: boolean; models?: string[]; error?: string }> {
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Say hello' }] }],
    })
    await result.response
    return { success: true }
  } catch (error: any) {
    console.error('API test failed:', error)
    return { 
      success: false, 
      error: error.message || 'Unknown error' 
    }
  }
}