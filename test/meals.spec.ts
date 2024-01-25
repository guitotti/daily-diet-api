import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Meals Routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new meal', async () => {
    const user = await request(app.server)
      .post('/users')
      .send({
        name: 'Peter Parker',
        email: 'parker@email.com',
        password: '12345',
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Fruits and bread slice with peanut butter',
        isInTheDiet: true,
        date: new Date(),
      })
      .expect(201)
  })

  it('should be able to list all the meals from a user', async () => {
    const user = await request(app.server)
      .post('/users')
      .send({
        name: 'Peter Parker',
        email: 'parker@email.com',
        password: '12345',
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Fruits and bread slice with peanut butter',
        isInTheDiet: true,
        date: new Date(),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Lunch',
        description: 'Soy stroganoff with zucchini',
        isInTheDiet: true,
        date: new Date(),
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    expect(mealsResponse.body.meals).toHaveLength(2)
  })

  it('should be able to get a specific meal from a user', async () => {
    const user = await request(app.server)
      .post('/users')
      .send({
        name: 'Peter Parker',
        email: 'parker@email.com',
        password: '12345',
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Fruits and bread slice with peanut butter',
        isInTheDiet: true,
        date: new Date(),
      })
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    const getMealReponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    expect(getMealReponse.body).toEqual({
      meal: expect.objectContaining({
        name: 'Breakfast',
        description: 'Fruits and bread slice with peanut butter',
        is_in_the_diet: 1,
        date: expect.any(Number),
      }),
    })
  })

  it('should be able to update a meal from a user', async () => {
    const user = await request(app.server)
      .post('/users')
      .send({
        name: 'Peter Parker',
        email: 'parker@email.com',
        password: '12345',
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Fruits and bread slice with peanut butter',
        isInTheDiet: true,
        date: new Date(),
      })
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Lunch',
        description: 'Soy stroganoff with zucchini',
        isInTheDiet: true,
        date: new Date(),
      })
      .expect(204)
  })

  it('should be able to delete a meal from a user', async () => {
    const user = await request(app.server)
      .post('/users')
      .send({
        name: 'Peter Parker',
        email: 'parker@email.com',
        password: '12345',
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Fruits and bread slice with peanut butter',
        isInTheDiet: true,
        date: new Date(),
      })
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', user.get('Set-Cookie'))
      .expect(204)
  })

  it('should be able to get the summary from a user', async () => {
    const user = await request(app.server)
      .post('/users')
      .send({
        name: 'Peter Parker',
        email: 'parker@email.com',
        password: '12345',
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Fruits and bread slice with peanut butter',
        isInTheDiet: true,
        date: new Date('2024-01-22T06:20:00'),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Lunch',
        description: 'Eggplant lasagna',
        isInTheDiet: true,
        date: new Date('2024-01-22T12:30:00'),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Afternoon coffee',
        description: 'Vegan cappuccino with almond milk',
        isInTheDiet: false,
        date: new Date('2024-01-22T16:30:00'),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Dinner',
        description: 'Soy stroganoff with zucchini',
        isInTheDiet: true,
        date: new Date('2024-01-22T19:30:00'),
      })

    const metricsResponse = await request(app.server)
      .get('/meals/summary')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    expect(metricsResponse.body).toEqual({
      totalOfMeals: 4,
      dietMeals: 3,
      offDietMeals: 1,
      bestDietMealsSequence: 2,
    })
  })
})
