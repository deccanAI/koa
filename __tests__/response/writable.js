'use strict'

const assert = require('assert')
const Koa = require('../../')
const net = require('net')

describe('res.writable', () => {
  describe('when continuous requests in one persistent connection', () => {
    function requestTwice (server, done) {
      const port = server.address().port
      const buf = Buffer.from('GET / HTTP/1.1\r\nHost: localhost:' + port + '\r\nConnection: keep-alive\r\n\r\n')
      const client = net.connect(port)
      const datas = []
      client
        .on('error', err => {
          client.destroy()
          done(err)
        })
        .on('data', data => datas.push(data))
        .on('end', () => done(null, datas))
      
      setImmediate(() => client.write(buf))
      setImmediate(() => client.write(buf))
      setTimeout(() => client.end(), 100)
      
      // Safety timeout to ensure client is closed
      setTimeout(() => {
        if (!client.destroyed) client.destroy()
      }, 500)
      
      return client
    }

    it('should always be writable and respond to all requests', done => {
      const app = new Koa()
      let count = 0
      let server
      
      app.use(ctx => {
        count++
        ctx.body = 'request ' + count + ', writable: ' + ctx.writable
      })

      server = app.listen()
      const client = requestTwice(server, (err, datas) => {
        if (err) {
          server.close(() => done(err))
          return
        }
        
        try {
          const responses = Buffer.concat(datas).toString()
          assert.strictEqual(/request 1, writable: true/.test(responses), true)
          assert.strictEqual(/request 2, writable: true/.test(responses), true)
          server.close(() => done())
        } catch (err) {
          server.close(() => done(err))
        }
      })
    })
  })

  describe('when socket closed before response sent', () => {
    function requestClosed (server) {
      const port = server.address().port
      const buf = Buffer.from('GET / HTTP/1.1\r\nHost: localhost:' + port + '\r\nConnection: keep-alive\r\n\r\n')
      const client = net.connect(port)
      client.on('error', () => {}) // Handle potential ECONNRESET errors
      setImmediate(() => {
        client.write(buf)
        client.end()
      })
      return client
    }

    it('should not be writable', done => {
      const app = new Koa()
      let server
      
      app.use(ctx => {
        sleep(100) // Reduced from 1000ms to 100ms
          .then(() => {
            if (ctx.writable) {
              server.close(() => done(new Error('ctx.writable should not be true')))
            } else {
              server.close(() => done())
            }
          })
          .catch(err => {
            server.close(() => done(err))
          })
      })
      
      server = app.listen()
      const client = requestClosed(server)
      
      // Ensure cleanup if test fails
      setTimeout(() => {
        if (client.destroyed === false) client.destroy()
      }, 200)
    })
  })

  describe('when response finished', () => {
    function request (server) {
      const port = server.address().port
      const buf = Buffer.from('GET / HTTP/1.1\r\nHost: localhost:' + port + '\r\nConnection: keep-alive\r\n\r\n')
      const client = net.connect(port)
      client.on('error', () => {}) // Handle potential ECONNRESET errors
      
      setImmediate(() => {
        client.write(buf)
      })
      setTimeout(() => {
        client.end()
      }, 100)
      
      return client
    }

    it('should not be writable', done => {
      const app = new Koa()
      let server
      
      app.use(ctx => {
        ctx.res.end()
        if (ctx.writable) {
          server.close(() => done(new Error('ctx.writable should not be true')))
        } else {
          server.close(() => done())
        }
      })
      
      server = app.listen()
      const client = request(server)
      
      // Ensure client is destroyed if test fails
      setTimeout(() => {
        if (!client.destroyed) client.destroy()
      }, 200)
    })
  })
})

function sleep (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}
