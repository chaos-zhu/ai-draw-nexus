import type { Env, ChatRequest, LLMConfig } from './_shared/types'
import { corsHeaders, handleCors } from './_shared/cors'
import { validateAccess } from './_shared/auth'
import { callOpenAI, callAnthropic } from './_shared/ai-providers'
import { streamOpenAI } from './_shared/stream-openai'
import { streamAnthropic } from './_shared/stream-anthropic'

interface PagesContext {
  request: Request
  env: Env
}

/**
 * 根据 LLM 配置创建有效的环境变量对象
 */
function createEffectiveEnv(env: Env, llmConfig?: LLMConfig): Env {
  if (!llmConfig || !llmConfig.apiKey) {
    return env
  }
  console.log('llmConfig', llmConfig)
  return {
    AI_PROVIDER: llmConfig.provider || env.AI_PROVIDER,
    AI_BASE_URL: llmConfig.baseUrl || env.AI_BASE_URL,
    AI_API_KEY: llmConfig.apiKey,
    AI_MODEL_ID: llmConfig.modelId || env.AI_MODEL_ID,
  }
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers: corsHeaders })
}

export const onRequestPost: PagesFunction<Env> = async (context: PagesContext) => {
  const { request, env } = context

  try {
    const body: ChatRequest = await request.json()
    const { messages, stream = false, llmConfig } = body

    const hasCustomLLM = !!(llmConfig && llmConfig.apiKey)
    const { valid, error } = validateAccess(request, env, hasCustomLLM)

    if (!valid) {
      return new Response(JSON.stringify({ error: error || '访问被拒绝' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request: messages required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const effectiveEnv = createEffectiveEnv(env, llmConfig)
    const provider = effectiveEnv.AI_PROVIDER || 'openai'

    if (stream) {
      switch (provider) {
        case 'anthropic':
          return streamAnthropic(messages, effectiveEnv)
        case 'openai':
        default:
          return streamOpenAI(messages, effectiveEnv)
      }
    } else {
      let response: string

      switch (provider) {
        case 'anthropic':
          response = await callAnthropic(messages, effectiveEnv)
          break
        case 'openai':
        default:
          response = await callOpenAI(messages, effectiveEnv)
          break
      }

      return new Response(JSON.stringify({ content: response }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    console.error('Chat error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
