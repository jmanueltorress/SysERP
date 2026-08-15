import express from 'express'

import {
  login,
  me,
} from '../controllers/auth.controller.js'

import {
  autenticar,
} from '../middleware/autenticar.js'

const router = express.Router()

router.post(
  '/login',
  login
)

router.get(
  '/me',
  autenticar,
  me
)

export default router