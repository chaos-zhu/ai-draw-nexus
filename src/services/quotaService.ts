/**
 * 访问控制服务
 * 管理访问密码和自定义 LLM 配置
 */

const PASSWORD_STORAGE_KEY = 'ai-draw-access-password'
const LLM_CONFIG_STORAGE_KEY = 'ai-draw-llm-config'

export interface LLMConfig {
  provider: string // 'openai' | 'anthropic'
  baseUrl: string
  apiKey: string
  modelId: string
}

export const quotaService = {
  /**
   * 获取存储的访问密码
   */
  getAccessPassword(): string {
    return localStorage.getItem(PASSWORD_STORAGE_KEY) || ''
  },

  /**
   * 保存访问密码
   */
  setAccessPassword(password: string): void {
    localStorage.setItem(PASSWORD_STORAGE_KEY, password)
  },

  /**
   * 清除访问密码
   */
  clearAccessPassword(): void {
    localStorage.removeItem(PASSWORD_STORAGE_KEY)
  },

  /**
   * 是否已设置访问密码
   */
  hasAccessPassword(): boolean {
    return !!this.getAccessPassword()
  },

  /**
   * 获取存储的 LLM 配置
   */
  getLLMConfig(): LLMConfig | null {
    const stored = localStorage.getItem(LLM_CONFIG_STORAGE_KEY)
    if (!stored) return null
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  },

  /**
   * 保存 LLM 配置
   */
  setLLMConfig(config: LLMConfig): void {
    localStorage.setItem(LLM_CONFIG_STORAGE_KEY, JSON.stringify(config))
  },

  /**
   * 清除 LLM 配置
   */
  clearLLMConfig(): void {
    localStorage.removeItem(LLM_CONFIG_STORAGE_KEY)
  },

  /**
   * 是否已设置有效的 LLM 配置
   */
  hasLLMConfig(): boolean {
    const config = this.getLLMConfig()
    return !!(config && config.apiKey && config.baseUrl)
  },
}
