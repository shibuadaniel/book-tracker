import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { createReadStream, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, 'dist')
const port = Number(process.env.PORT || 4173)

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
}

async function proxyNyt(req, res, url) {
  const target = new URL(url.pathname.replace(/^\/api\/nyt/, '/svc/books/v3') + url.search, 'https://api.nytimes.com')
  try {
    const upstream = await fetch(target, {
      headers: { Accept: 'application/json' },
    })
    const body = Buffer.from(await upstream.arrayBuffer())
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    })
    res.end(body)
  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ fault: String(error) }))
  }
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath)
  res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' })
  createReadStream(filePath).pipe(res)
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (url.pathname.startsWith('/api/nyt')) {
    await proxyNyt(req, res, url)
    return
  }

  const safePath = path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, '')
  let filePath = path.join(distDir, safePath === '/' ? 'index.html' : safePath)

  if (!filePath.startsWith(distDir)) {
    res.writeHead(403).end('Forbidden')
    return
  }

  if (existsSync(filePath) && !filePath.endsWith('/')) {
    sendFile(res, filePath)
    return
  }

  // SPA fallback
  try {
    const html = await readFile(path.join(distDir, 'index.html'))
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
  } catch {
    res.writeHead(404).end('Not found. Run npm run build first.')
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Book Tracker listening on http://127.0.0.1:${port}`)
})
