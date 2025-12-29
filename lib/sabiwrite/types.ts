export interface WalletAccount {
  id: string
  user_id: string
  balance_kobo: number
  currency: string
  created_at: string
  updated_at: string
}

export interface WalletLedgerEntry {
  id: string
  wallet_id: string
  user_id: string
  transaction_type: 'credit' | 'debit' | 'refund' | 'bonus'
  amount_kobo: number
  balance_before: number
  balance_after: number
  reference_type?: string
  reference_id?: string
  description?: string
  metadata?: Record<string, any>
  created_at: string
}

export type ToolType = 
  | 'rewrite' 
  | 'shorten' 
  | 'expand' 
  | 'simplify' 
  | 'clarity' 
  | 'tone_change' 
  | 'detection' 
  | 'humanize' 
  | 'plagiarism'

export type PlanTier = 'free' | 'daily' | 'weekly' | 'monthly' | 'pro'

export type ToneType = 
  | 'formal' 
  | 'neutral' 
  | 'friendly' 
  | 'executive' 
  | 'academic'
  | 'casual'
  | 'professional'

export interface PricingRule {
  id: string
  tool_type: ToolType
  plan_tier: PlanTier
  base_cost_kobo: number
  per_chunk_cost_kobo: number
  max_input_tokens: number
  model_preference: 'deepseek' | 'haiku' | 'auto'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CostEstimate {
  baseCostKobo: number
  chunkCount: number
  totalCostKobo: number
  totalCostNaira: number
  requiresConfirmation: boolean
  breakdown: {
    perChunkCostKobo: number
    inputTokens: number
    estimatedOutputTokens: number
  }
}

export type SessionStatus = 'active' | 'archived' | 'deleted'
export type MessageRole = 'user' | 'assistant' | 'system'
export type MessageContentType = 'text' | 'file' | 'output' | 'receipt'

export interface SabiwriteSession {
  id: string
  user_id: string
  title?: string
  status: SessionStatus
  last_tool_used?: ToolType
  total_cost_kobo: number
  message_count: number
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface SabiwriteMessage {
  id: string
  session_id: string
  user_id: string
  role: MessageRole
  content: string
  content_type: MessageContentType
  operation_id?: string
  metadata?: Record<string, any>
  created_at: string
}

export type OperationStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'partial'

export type ModelProvider = 'anthropic' | 'deepseek'

export interface SabiwriteOperation {
  id: string
  session_id: string
  user_id: string
  tool_type: ToolType
  action?: string
  pricing_rule_id?: string
  input_text?: string
  input_chars?: number
  input_tokens?: number
  chunk_count: number
  file_id?: string
  output_text?: string
  output_tokens?: number
  model_provider: ModelProvider
  model_name: string
  route_reason?: string
  cost_kobo: number
  estimated_cost_kobo?: number
  status: OperationStatus
  error_message?: string
  started_at?: string
  completed_at?: string
  duration_ms?: number
  created_at: string
}

export type FileType = 'pdf' | 'docx' | 'pptx' | 'txt'
export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface SabiwriteFile {
  id: string
  user_id: string
  session_id?: string
  original_name: string
  file_type: FileType
  mime_type?: string
  file_size_bytes: number
  storage_path?: string
  extracted_text?: string
  extracted_chars?: number
  extracted_tokens?: number
  extraction_status: ExtractionStatus
  extraction_error?: string
  created_at: string
  deleted_at?: string
}

export interface SabiwriteUsage {
  id: string
  user_id: string
  date: string
  tool_type: ToolType
  operation_count: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost_kobo: number
  deepseek_count: number
  haiku_count: number
  created_at: string
  updated_at: string
}

export interface SabiwriteRefund {
  id: string
  user_id: string
  operation_id: string
  ledger_entry_id?: string
  amount_kobo: number
  reason?: string
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  processed_by?: string
  processed_at?: string
  created_at: string
}

export interface RouteDecision {
  provider: ModelProvider
  model: string
  reason: string
}