import fastify from 'fastify'
import crypto from 'node:crypto'
import { knex } from './database'
import { env } from './env'

const app = fastify()

app.get('/hello', async () => {
  const users = await knex('users')
    .insert({
      id: crypto.randomUUID(),
      name: 'Guilherme Totti',
    })
    .returning('*')

  return users
})

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('HTTP Server Running')
  })
