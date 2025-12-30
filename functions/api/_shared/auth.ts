import type { Env } from './types'

/**
 * 验证访问权限 - 必须提供正确的访问密码或自定义 LLM 配置
 * @returns { valid: boolean, error?: string }
 * - valid: 请求是否有效
 * - error: 错误信息（如果无效）
 */
export function validateAccess(
  request: Request,
  env: Env,
  hasCustomLLM: boolean
): { valid: boolean; error?: string } {
  const password = request.headers.get('X-Access-Password')
  const configuredPassword = env.ACCESS_PASSWORD

  // If user provides custom LLM config, allow access
  if (hasCustomLLM) {
    return { valid: true }
  }

  // If no configured password on server, require custom LLM
  if (!configuredPassword) {
    return { valid: false, error: '服务端未配置访问密码，请使用自定义 LLM 配置' }
  }

  // If no password provided by user
  if (!password) {
    return { valid: false, error: '请输入访问密码或配置自定义 LLM' }
  }

  // Validate password
  if (password === configuredPassword) {
    return { valid: true }
  }

  return { valid: false, error: '访问密码错误' }
}
