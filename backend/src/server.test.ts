import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import app from './server.js'

describe('Server Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)

    expect(response.body).toEqual({
      status: 'ok',
      message: 'Servidor funcionando correctamente'
    })
  })

  it('should return API info on root', async () => {
    const response = await request(app)
      .get('/')
      .expect(200)

    expect(response.body).toHaveProperty('status', 'ok')
    expect(response.body).toHaveProperty('version', '1.0.0')
    expect(response.body).toHaveProperty('endpoints')
  })
})

