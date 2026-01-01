// lib/sabiquiz/prompts.ts

import type { ContextProfile, GenerationMode } from './context-profile'
import type { ChunkRecord } from './chunker'

// ============================================================================
// TYPES
// ============================================================================

export interface ObjectiveExtractionPrompt {
  systemPrompt: string
  userPrompt: string
}

export interface QuestionGenerationPrompt {
  systemPrompt: string
  userPrompt: string
}

export interface ReviewPrompt {
  systemPrompt: string
  userPrompt: string
}

// ============================================================================
// SYSTEM PROMPTS BY MODE
// ============================================================================

const MODE_SYSTEM_PROMPTS: Record<GenerationMode, string> = {
  school: `You are an expert educational assessment designer specializing in classroom quizzes for secondary school students.

Your questions must be:
- Clear, age-appropriate, and educational
- Focused on understanding and recall
- Free of ambiguity or trick elements
- Encouraging learning through well-crafted explanations

Style guidelines:
- Use simple, accessible language
- Provide concrete examples when possible
- Avoid jargon unless it's being tested
- Make questions feel supportive, not intimidating`,

  corporate: `You are an expert corporate training assessment designer specializing in workplace learning and professional development.

Your questions must be:
- Practical and job-relevant
- Scenario-based with realistic workplace situations
- Focused on application and decision-making
- Professional in tone and terminology

Style guidelines:
- Use business-appropriate language
- Frame questions around real work tasks
- Include decision-making scenarios
- Focus on skills that transfer to the job`,

  certification: `You are an expert certification exam designer specializing in vendor-style professional certifications.

Your questions must be:
- Precise and technically accurate
- Scenario-based with complex situations
- Aligned with certification exam standards
- Testing both knowledge and application

Style guidelines:
- Use precise technical terminology
- Include multi-step problem scenarios
- Test nuanced understanding
- Match the rigor of real certification exams`,
}

// ============================================================================
// OBJECTIVE EXTRACTION PROMPT
// ============================================================================

export function buildObjectiveExtractionPrompt(
  profile: ContextProfile,
  chunks: ChunkRecord[]
): ObjectiveExtractionPrompt {
  const chunkTexts = chunks.map((c, i) => `[CHUNK_${c.id}]\n${c.text}`).join('\n\n---\n\n')

  const systemPrompt = `You are an expert curriculum analyst. Your task is to extract learning objectives and key terms from educational content.

You must:
1. Identify 10-25 specific, testable learning objectives
2. Extract 20-60 key terms and concepts
3. Map each objective to the chunk(s) that support it
4. Ensure objectives are concrete and measurable

Context:
- Domain: ${profile.domain}
- Audience: ${profile.audience}
- Mode: ${profile.mode}

Output must be valid JSON only. No markdown, no explanations outside the JSON.`

  const userPrompt = `Analyze the following content and extract learning objectives and key terms.

CONTENT:
${chunkTexts}

OUTPUT FORMAT (JSON only):
{
  "learning_objectives": [
    {
      "id": "OBJ_1",
      "objective": "Describe the specific learning outcome",
      "bloom_level": "remember|understand|apply|analyze|evaluate|create",
      "supporting_chunk_ids": ["chunk-uuid-1", "chunk-uuid-2"],
      "key_concepts": ["concept1", "concept2"]
    }
  ],
  "key_terms": [
    {
      "term": "Term name",
      "definition": "Brief definition from the content",
      "chunk_id": "chunk-uuid"
    }
  ],
  "topic_map": {
    "Topic Name": ["chunk-uuid-1", "chunk-uuid-2"]
  }
}

Extract objectives now. Return ONLY valid JSON.`

  return { systemPrompt, userPrompt }
}

// ============================================================================
// QUESTION GENERATION PROMPT
// ============================================================================

export function buildQuestionGenerationPrompt(
  profile: ContextProfile,
  objective: {
    id: string
    objective: string
    supporting_chunk_ids: string[]
    key_concepts: string[]
  },
  chunks: ChunkRecord[],
  difficulty: 'easy' | 'medium' | 'hard'
): QuestionGenerationPrompt {
  // Get only the relevant chunks for this objective
  const relevantChunks = chunks.filter(c => 
    objective.supporting_chunk_ids.includes(c.id)
  )
  const chunkTexts = relevantChunks.map(c => `[CHUNK_${c.id}]\n${c.text}`).join('\n\n')

  const questionTypes = profile.questionStyle.preferredTypes.join(', ')
  
  const difficultyGuidance = getDifficultyGuidance(difficulty, profile.mode)
  const antiGamingRules = getAntiGamingRules()
  const optionConstraints = getOptionConstraints(profile)

  const systemPrompt = MODE_SYSTEM_PROMPTS[profile.mode]

  const userPrompt = `Generate 2 high-quality ${difficulty} questions for this learning objective.

LEARNING OBJECTIVE:
${objective.objective}

KEY CONCEPTS TO TEST:
${objective.key_concepts.join(', ')}

SOURCE CONTENT (use ONLY this content):
${chunkTexts}

QUESTION REQUIREMENTS:
- Difficulty: ${difficulty}
${difficultyGuidance}

- Allowed question types: ${questionTypes}
- ${profile.questionStyle.scenarioFrequency === 'high' ? 'Use realistic scenarios when possible' : 'Direct questions preferred'}

${antiGamingRules}

${optionConstraints}

EXPLANATION REQUIREMENTS:
- Explain WHY the correct answer is correct
- Explain WHY at least one distractor is wrong
- Reference the source content
- Minimum ${profile.constraints.explanationMinLength} characters

OUTPUT FORMAT (JSON array only):
[
  {
    "question_type": "single_correct",
    "difficulty": "${difficulty}",
    "topic": "Topic name",
    "stem": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Detailed explanation...",
    "source_chunk_ids": ["chunk-uuid"]
  }
]

For multi_select questions, use "correct_answers": [0, 2] instead of "correct_answer".

Generate exactly 2 questions. Return ONLY valid JSON array.`

  return { systemPrompt, userPrompt }
}

// ============================================================================
// REVIEW PROMPT
// ============================================================================

export function buildReviewPrompt(
  profile: ContextProfile,
  question: any,
  sourceChunks: ChunkRecord[]
): ReviewPrompt {
  const chunkTexts = sourceChunks.map(c => c.text).join('\n\n')

  const systemPrompt = `You are an expert question reviewer and editor. Your task is to evaluate questions for quality and fix any issues.

Evaluation criteria:
1. RELEVANCE: Question must be answerable from the source content
2. CLARITY: Question stem must be unambiguous
3. OPTIONS: All options must be plausible, similar length, no giveaways
4. CORRECTNESS: The marked answer must be definitively correct
5. EXPLANATION: Must be educational and reference the content
6. ANTI-GAMING: Correct answer must not be obvious from length/specificity

You must return either:
- {"status": "approved", "question": <original question>}
- {"status": "fix", "question": <corrected question>, "fixes_applied": ["list of fixes"]}
- {"status": "reject", "reason": "Why it cannot be fixed"}`

  const userPrompt = `Review this question for quality and correctness.

QUESTION TO REVIEW:
${JSON.stringify(question, null, 2)}

SOURCE CONTENT:
${chunkTexts}

CONTEXT:
- Mode: ${profile.mode}
- Audience: ${profile.audience}
- Max question length: ${profile.constraints.maxQuestionLength} chars
- Max option length: ${profile.constraints.maxOptionLength} chars

CHECK FOR:
1. Is the question answerable from the source content?
2. Is there exactly one correct answer (or correct set for multi-select)?
3. Are all distractors plausible but clearly wrong?
4. Are option lengths balanced (no giveaway from length)?
5. Is the explanation educational and accurate?
6. Does the difficulty match the question complexity?

Return your evaluation as JSON only.`

  return { systemPrompt, userPrompt }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDifficultyGuidance(difficulty: 'easy' | 'medium' | 'hard', mode: GenerationMode): string {
  const guidance: Record<string, Record<string, string>> = {
    easy: {
      school: '- Test direct recall and basic understanding\n- Use straightforward language\n- One clear concept per question',
      corporate: '- Test fundamental concepts and definitions\n- Simple workplace scenarios\n- Clear-cut correct answers',
      certification: '- Test terminology and basic concepts\n- Straightforward scenarios\n- Foundation-level knowledge',
    },
    medium: {
      school: '- Test understanding and simple application\n- May require connecting two concepts\n- Some interpretation needed',
      corporate: '- Test application in realistic scenarios\n- Require judgment and prioritization\n- Multiple factors to consider',
      certification: '- Test application and analysis\n- Multi-step reasoning required\n- Real-world scenario complexity',
    },
    hard: {
      school: '- Test analysis and evaluation\n- Complex scenarios or edge cases\n- Multiple concepts integrated',
      corporate: '- Test complex decision-making\n- Ambiguous situations requiring best judgment\n- Strategic thinking required',
      certification: '- Test synthesis and evaluation\n- Complex multi-factor scenarios\n- Expert-level nuance required',
    },
  }

  return guidance[difficulty][mode]
}

function getAntiGamingRules(): string {
  return `ANTI-GAMING RULES (CRITICAL):
- All options must be similar in length (within 20% of each other)
- Correct answer must NOT be the most detailed or specific option
- Avoid "all of the above" or "none of the above"
- Avoid absolute words (always, never, only) unless testing them specifically
- Distractors must be plausible, not obviously wrong
- Do not use patterns (correct answer is not always B or C)
- Numbers and specifics should appear in multiple options, not just the correct one`
}

function getOptionConstraints(profile: ContextProfile): string {
  const numOptions = profile.mode === 'certification' ? '4-5' : '4'
  
  return `OPTION CONSTRAINTS:
- Provide exactly ${numOptions} options
- Each option max ${profile.constraints.maxOptionLength} characters
- Options must be mutually exclusive
- Use parallel grammatical structure
- Start options with different words when possible`
}

// ============================================================================
// SIMPLE GENERATION PROMPT (FALLBACK)
// ============================================================================

export function buildSimpleGenerationPrompt(
  profile: ContextProfile,
  text: string,
  questionCount: number,
  difficultyMix: { easy: number; medium: number; hard: number }
): QuestionGenerationPrompt {
  const systemPrompt = MODE_SYSTEM_PROMPTS[profile.mode]

  const userPrompt = `Generate ${questionCount} high-quality multiple-choice questions from this content.

CONTENT:
${text.substring(0, 15000)}

DIFFICULTY DISTRIBUTION:
- Easy: ${difficultyMix.easy} questions
- Medium: ${difficultyMix.medium} questions  
- Hard: ${difficultyMix.hard} questions

CONTEXT:
- Domain: ${profile.domain}
- Audience: ${profile.audience}
- Style: ${profile.examStyle}

${getAntiGamingRules()}

${getOptionConstraints(profile)}

EXPLANATION REQUIREMENTS:
- Each explanation must be ${profile.constraints.explanationMinLength}+ characters
- Explain why correct answer is right
- Explain why at least one wrong answer is wrong

OUTPUT FORMAT (JSON array only):
[
  {
    "question_type": "single_correct",
    "difficulty": "easy|medium|hard",
    "topic": "Topic from content",
    "stem": "Question text",
    "options": ["A", "B", "C", "D"],
    "correct_answer": 0,
    "explanation": "Educational explanation..."
  }
]

Generate exactly ${questionCount} questions. Return ONLY valid JSON array.`

  return { systemPrompt, userPrompt }
}