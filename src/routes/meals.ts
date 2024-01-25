import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createMealsBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isInTheDiet: z.boolean(),
        date: z.coerce.date(),
      })

      const { name, description, isInTheDiet, date } =
        createMealsBodySchema.parse(request.body)

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        is_in_the_diet: isInTheDiet,
        date: date.getTime(), // unix timestamp
        user_id: request.user?.id,
      })

      return reply.status(201).send()
    },
  )

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const mealsByUser = await knex('meals')
        .where({
          user_id: request.user?.id,
        })
        .orderBy('date', 'desc')

      return reply.send({ meals: mealsByUser })
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const paramsSchema = z.object({ id: z.string().uuid() })

      const { id } = paramsSchema.parse(request.params)

      const meal = await knex('meals')
        .where({ id, user_id: request.user?.id })
        .first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found. ' })
      }

      return reply.send({ meal })
    },
  )

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const paramsSchema = z.object({ id: z.string().uuid() })

      const { id } = paramsSchema.parse(request.params)

      const updateMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isInTheDiet: z.boolean(),
        date: z.coerce.date(),
      })

      const { name, description, isInTheDiet, date } =
        updateMealBodySchema.parse(request.body)

      const meal = await knex('meals').where({ id }).first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      await knex('meals').where({ id }).update({
        name,
        description,
        is_in_the_diet: isInTheDiet,
        date: date.getTime(), // unix timestamp
      })

      return reply.status(204).send()
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const paramsSchema = z.object({ id: z.string().uuid() })

      const { id } = paramsSchema.parse(request.params)

      const meal = await knex('meals').where({ id }).first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found. ' })
      }

      await knex('meals').where({ id }).delete()

      return reply.status(204).send()
    },
  )

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const dietMeals = await knex('meals')
        .where({ user_id: request.user?.id, is_in_the_diet: true })
        .count('id', { as: 'total' })
        .first()

      const offDietMeals = await knex('meals')
        .where({ user_id: request.user?.id, is_in_the_diet: false })
        .count('id', { as: 'total' })
        .first()

      const totalOfMeals = await knex('meals')
        .where({ user_id: request.user?.id })
        .orderBy('date', 'desc')

      const { bestDietMealsSequence } = totalOfMeals.reduce(
        (acc, meal) => {
          if (meal.is_in_the_diet) {
            acc.currentSequence += 1
          } else {
            acc.currentSequence = 0
          }

          acc.bestDietMealsSequence = Math.max(
            acc.bestDietMealsSequence,
            acc.currentSequence,
          )

          return acc
        },
        { bestDietMealsSequence: 0, currentSequence: 0 },
      )

      return reply.send({
        totalOfMeals: totalOfMeals.length,
        dietMeals: dietMeals?.total,
        offDietMeals: offDietMeals?.total,
        bestDietMealsSequence,
      })
    },
  )
}
