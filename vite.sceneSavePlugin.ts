import fs from 'node:fs/promises'
import path from 'node:path'
import type { Plugin, Connect } from 'vite'

const SAVE_PATH = '/__rib/save-scene'
const CONFIGS_DIR = 'public/assets/configs'
const DEFAULT_RELATIVE = 'assets/configs/Office MVP.json'

function resolveSafeTarget(root: string, relativePath: string): string | null {
  const cleaned = relativePath.replace(/^\/+/, '').replace(/\\/g, '/')
  if (!cleaned.startsWith('assets/configs/') || cleaned.includes('..')) return null
  if (!cleaned.toLowerCase().endsWith('.json')) return null
  const absolute = path.resolve(root, 'public', cleaned)
  const configsRoot = path.resolve(root, CONFIGS_DIR)
  if (!absolute.startsWith(configsRoot + path.sep) && absolute !== configsRoot) return null
  return absolute
}

async function readBody(req: Connect.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

/** Dev-only: POST /__rib/save-scene { path?, json } writes under public/assets/configs/. */
export function sceneSavePlugin(): Plugin {
  return {
    name: 'rib-scene-save',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST' || req.url?.split('?')[0] !== SAVE_PATH) {
          next()
          return
        }
        try {
          const body = JSON.parse(await readBody(req)) as { path?: string; json?: string }
          const relative = (body.path || DEFAULT_RELATIVE).trim() || DEFAULT_RELATIVE
          const json = body.json
          if (typeof json !== 'string' || !json) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: 'Missing json' }))
            return
          }
          JSON.parse(json)
          const target = resolveSafeTarget(server.config.root, relative)
          if (!target) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: 'Path must be under assets/configs/*.json' }))
            return
          }
          await fs.mkdir(path.dirname(target), { recursive: true })
          await fs.writeFile(target, json, 'utf8')
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, path: relative.replace(/^\/+/, '') }))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              ok: false,
              error: err instanceof Error ? err.message : 'Save failed',
            }),
          )
        }
      })
    },
  }
}

export const DEFAULT_SCENE_SAVE_PATH = DEFAULT_RELATIVE
