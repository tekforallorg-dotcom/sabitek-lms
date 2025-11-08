import { supabase } from '@/lib/supabase'

export interface AdminMaterial {
  id: string
  filename: string
  category: string
  level: string
  uploaded_by: string
  uploader_name: string
  uploader_email: string
  created_at: string
  questions_count: number
  attempts_count: number
}

export interface AdminQuestion {
  id: string
  material_id: string
  material_filename: string
  question_text: string
  question_type: string
  difficulty: string | null
  created_by: string
  creator_name: string
  created_at: string
  usage_count: number
}

export interface SystemStats {
  totalMaterials: number
  totalQuestions: number
  totalAttempts: number
  totalUsers: number
  averageScore: number
  materialsThisMonth: number
  questionsThisMonth: number
  attemptsThisMonth: number
}

/**
 * Check if user is admin or super admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, is_super_admin')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }
    
    if (!data) {
      console.error('No user data found')
      return false
    }

    // Check both role and is_super_admin flag
    return data.role === 'admin' || data.is_super_admin === true
  } catch (error) {
    console.error('Exception in isAdmin:', error)
    return false
  }
}

/**
 * Get all materials with stats
 */
export async function getAllMaterials(): Promise<AdminMaterial[]> {
  const { data, error } = await supabase
    .from('sabiquiz_materials')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching materials:', error)
    throw error
  }

  // Get users separately
  const userIds = [...new Set(data.map(m => m.uploaded_by))]
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email')
    .in('id', userIds)

  const userMap = new Map()
  users?.forEach(u => {
    userMap.set(u.id, u)
  })

  // Get question counts
  const { data: questionCounts } = await supabase
    .from('sabiquiz_questions')
    .select('material_id')

  // Get attempt counts
  const { data: attemptCounts } = await supabase
    .from('sabiquiz_attempts')
    .select('material_id')

  const questionCountMap = new Map<string, number>()
  questionCounts?.forEach(q => {
    questionCountMap.set(q.material_id, (questionCountMap.get(q.material_id) || 0) + 1)
  })

  const attemptCountMap = new Map<string, number>()
  attemptCounts?.forEach(a => {
    attemptCountMap.set(a.material_id, (attemptCountMap.get(a.material_id) || 0) + 1)
  })

  return data.map(material => {
    const user = userMap.get(material.uploaded_by)
    return {
      id: material.id,
      filename: material.filename,
      category: material.category || 'Uncategorized',
      level: material.level || 'Unknown',
      uploaded_by: material.uploaded_by,
      uploader_name: user?.full_name || 'Unknown',
      uploader_email: user?.email || '',
      created_at: material.created_at,
      questions_count: questionCountMap.get(material.id) || 0,
      attempts_count: attemptCountMap.get(material.id) || 0,
    }
  })
}

/**
 * Get all questions with stats
 */
export async function getAllQuestions(): Promise<AdminQuestion[]> {
  const { data, error } = await supabase
    .from('sabiquiz_questions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching questions:', error)
    throw error
  }

  // Get materials separately
  const materialIds = [...new Set(data.map(q => q.material_id))]
  const { data: materials } = await supabase
    .from('sabiquiz_materials')
    .select('id, filename')
    .in('id', materialIds)

  const materialMap = new Map()
  materials?.forEach(m => {
    materialMap.set(m.id, m.filename)
  })

  // Get creators separately
  const creatorIds = [...new Set(data.map(q => q.created_by))]
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', creatorIds)

  const userMap = new Map()
  users?.forEach(u => {
    userMap.set(u.id, u.full_name)
  })

  // Get usage counts (from responses table)
  const { data: responses } = await supabase
    .from('sabiquiz_responses')
    .select('question_id')

  const usageMap = new Map<string, number>()
  responses?.forEach(r => {
    usageMap.set(r.question_id, (usageMap.get(r.question_id) || 0) + 1)
  })

  return data.map(question => ({
    id: question.id,
    material_id: question.material_id,
    material_filename: materialMap.get(question.material_id) || 'Unknown',
    question_text: question.question_text,
    question_type: question.question_type,
    difficulty: question.difficulty,
    created_by: question.created_by,
    creator_name: userMap.get(question.created_by) || 'Unknown',
    created_at: question.created_at,
    usage_count: usageMap.get(question.id) || 0,
  }))
}

/**
 * Get system-wide statistics
 */
export async function getSystemStats(): Promise<SystemStats> {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Total counts
  const [materials, questions, attempts, users] = await Promise.all([
    supabase.from('sabiquiz_materials').select('id', { count: 'exact', head: true }),
    supabase.from('sabiquiz_questions').select('id', { count: 'exact', head: true }),
    supabase.from('sabiquiz_attempts').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }),
  ])

  // This month counts
  const [materialsThisMonth, questionsThisMonth, attemptsThisMonth] = await Promise.all([
    supabase.from('sabiquiz_materials').select('id', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
    supabase.from('sabiquiz_questions').select('id', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
    supabase.from('sabiquiz_attempts').select('id', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
  ])

  // Average score
  const { data: attemptsData } = await supabase
    .from('sabiquiz_attempts')
    .select('score')

  const averageScore = attemptsData && attemptsData.length > 0
    ? Math.round(attemptsData.reduce((sum, a) => sum + (a.score || 0), 0) / attemptsData.length)
    : 0

  return {
    totalMaterials: materials.count || 0,
    totalQuestions: questions.count || 0,
    totalAttempts: attempts.count || 0,
    totalUsers: users.count || 0,
    averageScore,
    materialsThisMonth: materialsThisMonth.count || 0,
    questionsThisMonth: questionsThisMonth.count || 0,
    attemptsThisMonth: attemptsThisMonth.count || 0,
  }
}

/**
 * Get usage data for charts (last 30 days)
 */
export async function getUsageChartData() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: attempts } = await supabase
    .from('sabiquiz_attempts')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())

  const { data: materials } = await supabase
    .from('sabiquiz_materials')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Group by day
  const dailyData = new Map<string, { attempts: number; materials: number }>()

  attempts?.forEach(a => {
    const day = new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!dailyData.has(day)) {
      dailyData.set(day, { attempts: 0, materials: 0 })
    }
    dailyData.get(day)!.attempts++
  })

  materials?.forEach(m => {
    const day = new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!dailyData.has(day)) {
      dailyData.set(day, { attempts: 0, materials: 0 })
    }
    dailyData.get(day)!.materials++
  })

  return Array.from(dailyData.entries())
    .map(([day, data]) => ({
      day,
      attempts: data.attempts,
      materials: data.materials,
    }))
    .slice(-14) // Last 14 days
}

/**
 * Delete material (admin only)
 */
export async function deleteMaterial(materialId: string, adminId: string): Promise<void> {
  const isAdminUser = await isAdmin(adminId)
  if (!isAdminUser) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('sabiquiz_materials')
    .delete()
    .eq('id', materialId)

  if (error) throw error
}

/**
 * Delete question (admin only)
 */
export async function deleteQuestion(questionId: string, adminId: string): Promise<void> {
  const isAdminUser = await isAdmin(adminId)
  if (!isAdminUser) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('sabiquiz_questions')
    .delete()
    .eq('id', questionId)

  if (error) throw error
}