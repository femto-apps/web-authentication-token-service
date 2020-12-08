// Imports 
const { promisify } = require('util')
const present = require('present')
const redis = require('redis')
const http = require('http')
const qs = require('qs')
const config = require('@femto-apps/config')

// Setup the redis client 
const redisURL = config.get('redisUrl') || 'redis://127.0.0.1:6379/0'
const client = redis.createClient(redisURL)
const getAsync = promisify(client.get).bind(client)

client.on('error', err => {
  console.log(`Received error: ${err}`)
  process.exit(1)
})

// Setup the http server 
const server = http.createServer(async (req, res) => {
  const start = present()
  const query = qs.parse(req.url.split('?')[1])
  res.setHeader('Content-Type', 'application/json')

  if (!query.token) {
    res.statusCode = 400
    res.write(JSON.stringify({ err: 'No token provided' }))
    return res.end()
  }

  // Get user from token
  const startGetAsync = present()
  const result = await getAsync(`${config.get('redisSession')}:${query.token}`)
  console.log(`GET ?token=${query.token} : getAsync ${Math.round((present() - startGetAsync) * 100) / 100}ms`)

  if (!result) {
    res.statusCode = 400
    res.write(JSON.stringify({ err: 'Token not found' }))
    return res.end()
  }

  res.write(result)
  res.end()

  console.log(`GET ?token=${query.token} : getReq ${Math.round((present() - start) * 100) / 100}ms`)
})

// Make the server listen 
server.listen(config.get('port'))
console.log(`Server listening on port ${config.get('port')}`)
