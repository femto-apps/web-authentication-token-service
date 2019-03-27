const { promisify } = require('util')
const redis = require('redis')
const http = require('http')
const qs = require('qs')

const client = redis.createClient()
const getAsync = promisify(client.get).bind(client)

client.on('error', err => {
  console.log(`Received error: ${err}`)
  process.exit(1)
})

const server = http.createServer(async (req, res) => {
  const query = qs.parse(req.url.split('?')[1])
  res.setHeader('Content-Type', 'application/json')

  if (!query.token) {
    res.statusCode = 400
    res.write(JSON.stringify({ err: 'No token provided' }))
    return res.end()
  }

  // get user from token
  const result = await getAsync(`sessions:${query.token}`)

  if (!result) {
    res.statusCode = 400
    res.write(JSON.stringify({ err: 'Token not found' }))
    return res.end()
  }

  res.write(result)
  res.end()
})

server.listen(4500)
console.log('Server listening on port 4500')
