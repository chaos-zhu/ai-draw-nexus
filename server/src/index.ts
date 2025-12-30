import express from 'express'
import cors from 'cors'
import { parseHTML } from 'linkedom'
import { Readability } from '@mozilla/readability'
import TurndownService from 'turndown'
import type { Env, ChatRequest, LLMConfig, Message } from './types.js'
import { callOpenAI, callAnthropic } from './ai-providers.js'
import { streamOpenAI, streamAnthropic } from './stream-handlers.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Access-Password', 'X-Custom-LLM'],
}))
app.use(express.json({ limit: '50mb' }))

// Get environment configuration
function getEnv(): Env {
  return {
    AI_PROVIDER: process.env.AI_PROVIDER || 'openai',
    AI_BASE_URL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    AI_API_KEY: process.env.AI_API_KEY || '',
    AI_MODEL_ID: process.env.AI_MODEL_ID || 'gpt-4o',
    ACCESS_PASSWORD: process.env.ACCESS_PASSWORD,
  }
}

// Create effective env with LLM config override
function createEffectiveEnv(env: Env, llmConfig?: LLMConfig): Env {
  if (!llmConfig || !llmConfig.apiKey) {
    return env
  }
  return {
    AI_PROVIDER: llmConfig.provider || env.AI_PROVIDER,
    AI_BASE_URL: llmConfig.baseUrl || env.AI_BASE_URL,
    AI_API_KEY: llmConfig.apiKey,
    AI_MODEL_ID: llmConfig.modelId || env.AI_MODEL_ID,
  }
}

// Validate access - requires either correct password or custom LLM config
function validateAccess(
  password: string | undefined,
  configuredPassword: string | undefined,
  hasCustomLLM: boolean
): { valid: boolean; error?: string } {
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

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const env = getEnv()
    const password = req.headers['x-access-password'] as string | undefined
    const body: ChatRequest = req.body
    const { messages, stream = false, llmConfig } = body

    const hasCustomLLM = !!(llmConfig && llmConfig.apiKey)
    const { valid, error } = validateAccess(password, env.ACCESS_PASSWORD, hasCustomLLM)

    if (!valid) {
      res.status(401).json({ error: error || '访问被拒绝' })
      return
    }

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Invalid request: messages required' })
      return
    }

    const effectiveEnv = createEffectiveEnv(env, llmConfig)
    const provider = effectiveEnv.AI_PROVIDER || 'openai'

    if (stream) {
      switch (provider) {
        case 'anthropic':
          await streamAnthropic(messages, effectiveEnv, res)
          break
        case 'openai':
        default:
          await streamOpenAI(messages, effectiveEnv, res)
          break
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

      res.json({ content: response })
    }
  } catch (error) {
    console.error('Chat error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: errorMessage })
  }
})

// Parse URL endpoint
function isWechatArticle(url: string): boolean {
  return url.includes('mp.weixin.qq.com')
}

function preprocessWechatArticle(document: Document): void {
  const jsContent = document.getElementById('js_content')
  if (jsContent) {
    (jsContent as HTMLElement).style.visibility = 'visible';
    (jsContent as HTMLElement).style.display = 'block'
  }

  const images = document.querySelectorAll('img[data-src]')
  images.forEach((img) => {
    const dataSrc = img.getAttribute('data-src')
    if (dataSrc) {
      img.setAttribute('src', dataSrc)
    }
  })

  const removeSelectors = [
    '#js_pc_qr_code',
    '#js_profile_qrcode',
    '.qr_code_pc_outer',
    '.rich_media_area_extra',
    '.reward_area',
    '#js_tags',
    '.original_area_primary',
    '.original_area_extra',
  ]
  removeSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector)
    elements.forEach((el) => el.remove())
  })
}

function extractWechatContent(document: Document): { title: string; content: string } | null {
  const titleEl = document.getElementById('activity-name') ||
                  document.querySelector('.rich_media_title') ||
                  document.querySelector('h1')
  const title = titleEl?.textContent?.trim() || '微信公众号文章'

  const contentEl = document.getElementById('js_content') ||
                    document.querySelector('.rich_media_content')

  if (!contentEl) {
    return null
  }

  return { title, content: contentEl.innerHTML }
}

app.post('/api/parse-url', async (req, res) => {
  try {
    const { url } = req.body as { url: string }

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: '请提供有效的URL' })
      return
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      res.status(400).json({ error: 'URL格式无效' })
      return
    }

    const isWechat = isWechatArticle(url)

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    }

    if (isWechat) {
      headers['Referer'] = 'https://mp.weixin.qq.com/'
    }

    const response = await fetch(url, { headers, redirect: 'follow' })

    if (!response.ok) {
      res.status(502).json({ error: `无法获取页面内容: ${response.status}` })
      return
    }

    const html = await response.text()
    const { document } = parseHTML(html)

    if (isWechat) {
      preprocessWechatArticle(document as unknown as Document)
    }

    const reader = new Readability(document.cloneNode(true) as unknown as Document)
    let article = reader.parse()

    if (!article && isWechat) {
      const wechatContent = extractWechatContent(document as unknown as Document)
      if (wechatContent) {
        article = {
          title: wechatContent.title,
          content: wechatContent.content,
          textContent: '',
          length: wechatContent.content.length,
          excerpt: '',
          byline: '',
          dir: '',
          siteName: '微信公众号',
          lang: 'zh-CN',
          publishedTime: null,
        }
      }
    }

    if (!article) {
      res.status(422).json({ error: '无法解析页面内容，该页面可能不是文章类型' })
      return
    }

    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    })

    turndownService.addRule('removeEmptyLinks', {
      filter: (node) => node.nodeName === 'A' && !node.textContent?.trim(),
      replacement: () => '',
    })

    turndownService.addRule('wechatImages', {
      filter: (node) => node.nodeName === 'IMG',
      replacement: (_content, node) => {
        const src = (node as Element).getAttribute('src') || (node as Element).getAttribute('data-src') || ''
        const alt = (node as Element).getAttribute('alt') || ''
        return src ? `![${alt}](${src})` : ''
      },
    })

    const wrappedHtml = `<!DOCTYPE html><html><body>${article.content || ''}</body></html>`
    const { document: contentDoc } = parseHTML(wrappedHtml)
    const markdown = turndownService.turndown(contentDoc.body as unknown as HTMLElement)

    const siteName = isWechat ? '微信公众号' : parsedUrl.hostname
    const fullMarkdown = `# ${article.title}\n\n> 来源: [${siteName}](${url})\n\n${markdown}`

    res.json({
      success: true,
      data: {
        title: article.title,
        content: fullMarkdown,
        excerpt: article.excerpt,
        siteName: article.siteName || siteName,
        url: url,
      },
    })
  } catch (error) {
    console.error('Parse URL error:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : '解析失败' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})