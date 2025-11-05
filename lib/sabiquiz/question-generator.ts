// lib/sabiquiz/question-generator.ts
import { supabase } from '@/lib/supabase'
import { generateContent, extractJSON } from './gemini-client'
import { validateQuestions, type Question } from './validators'

/**
 * Nigerian-focused prompt template
 * Enforces local context in all generated questions
 */
const NIGERIAN_PROMPT_TEMPLATE = `You are an expert Nigerian educator creating exam questions for secondary school students.

STRICT REQUIREMENTS (Questions will be REJECTED if you violate these):

1. **Names**: ONLY use Nigerian names like Chidi, Amina, Tunde, Ngozi, Ibrahim, Fatima, Emeka, Zainab, Ade, Hauwa, Uche, Aisha
2. **Places**: ONLY use Nigerian cities like Lagos, Kano, Abuja, Port Harcourt, Ibadan, Benin City, Enugu, Jos, Kaduna
3. **Money**: ONLY use Naira (₦) - NEVER dollars ($), pounds (£), or euros (€)
4. **Units**: ONLY metric (km, kg, liters, Celsius) - NEVER miles, feet, pounds, Fahrenheit
5. **Seasons**: Use "rainy season" or "dry season" - NEVER "winter" or "summer"
6. **Language**: Use simple, clear English (B2 CEFR level maximum)
7. **Culture**: Use Nigerian context (jollof rice, WAEC exams, NECO, etc.) when relevant
8. **Format**: British English spelling (colour, honour, organise)

Generate exactly 10 multiple-choice questions from the following study material.

MATERIAL:
{material_text}

OUTPUT FORMAT (valid JSON only):
{
  "questions": [
    {
      "question": "Clear, concise question stem",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "rationale": "Explanation of why this answer is correct (2-3 sentences)",
      "difficulty": "medium",
      "topic": "Specific topic covered"
    }
  ]
}

IMPORTANT:
- Generate EXACTLY 10 questions
- Each question MUST have EXACTLY 4 options
- correct_answer is the index (0-3) of the correct option
- Make questions practical and relevant to Nigerian students
- Vary difficulty across questions (3 easy, 5 medium, 2 hard)
- Ensure questions test understanding, not just memorization
- Options should be clearly distinct and plausible

Return ONLY valid JSON, no additional text.`

export interface GenerationResult {
  questions: Question[]
  totalGenerated: number
  passedValidation: number
  failedValidation: number
  overallQualityScore: number
  costEstimate: number
}

/**
 * Generate questions from study material
 */
export async function generateQuestions(
  materialText: string,
  materialId: string,
  category: string,
  level: string
): Promise<GenerationResult> {
  // Validate input
  if (!materialText || materialText.length < 100) {
    throw new Error('Material text too short. Need at least 100 characters to generate questions.')
  }

  // Truncate if too long (stay within token limits)
  const maxChars = 15000
  const truncatedText = materialText.length > maxChars 
    ? materialText.substring(0, maxChars) + '\n\n[Content truncated...]'
    : materialText

  // Create prompt
  const prompt = NIGERIAN_PROMPT_TEMPLATE.replace('{material_text}', truncatedText)

  // Call Gemini API
  console.log('🤖 Calling Gemini API...')
  const response = await generateContent(prompt)

  // Parse response
  console.log('📝 Parsing response...')
  const parsed = extractJSON<{ questions: Question[] }>(response)

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error('Invalid response format from AI')
  }

  if (parsed.questions.length === 0) {
    throw new Error('No questions generated')
  }

  // Validate questions
  console.log('✅ Validating questions...')
  const validation = validateQuestions(parsed.questions)

  // Estimate cost (Gemini 2.0 Flash Lite pricing - very cheap!)
  const costEstimate = 0.001 // ~$0.001 per generation

  return {
    questions: parsed.questions,
    totalGenerated: parsed.questions.length,
    passedValidation: validation.passedCount,
    failedValidation: validation.failedCount,
    overallQualityScore: validation.overallScore,
    costEstimate,
  }
}

/**
 * Save generated questions to database
 */
export async function saveQuestions(
  questions: Question[],
  materialId: string,
  userId: string,
  category: string,
  level: string
): Promise<void> {
  // Prepare questions for insertion with auto-approval
  const questionsToInsert = questions.map(q => ({
    material_id: materialId,
    category,
    level,
    topic: q.topic,
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    rationale: q.rationale,
    difficulty: q.difficulty,
    status: 'approved',
    created_by: userId,
  }))

  console.log('💾 Saving questions to database...')
  console.log('Questions to insert:', questionsToInsert.length)
  console.log('User ID:', userId)

  // Insert all questions
  const { data, error } = await supabase
    .from('sabiquiz_questions')
    .insert(questionsToInsert)
    .select()

  if (error) {
    console.error('❌ Database error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })
    throw new Error(`Failed to save questions: ${error.message}`)
  }

  console.log(`✅ Saved ${questions.length} questions to database`)
  console.log('Inserted data:', data)
}

/**
 * Generate and save questions in one call
 */
export async function generateAndSaveQuestions(
  materialText: string,
  materialId: string,
  userId: string,
  category: string,
  level: string
): Promise<GenerationResult> {
  // Generate questions
  const result = await generateQuestions(materialText, materialId, category, level)

  // Save to database
  await saveQuestions(result.questions, materialId, userId, category, level)

  return result
}

/**
 * Get questions for a material
 */
export async function getQuestionsForMaterial(materialId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('sabiquiz_questions')
    .select('*')
    .eq('material_id', materialId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Database error:', error)
    throw new Error('Failed to fetch questions')
  }

  return data || []
}