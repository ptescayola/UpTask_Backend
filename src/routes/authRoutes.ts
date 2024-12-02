import { Router } from 'express'
import { body, param } from 'express-validator'
import { AuthController } from '../controllers/AuthController'
import { handleInputErrors } from '../middleware/validation'
import { authenticate } from '../middleware/auth'
import { uploadConfig } from '../utils/multer'

const router = Router()

router.post('/create-account',
  body('name').notEmpty().withMessage('Field name required'),
  body('lastname').notEmpty().withMessage('Field lastname required'),
  body('password').isLength({ min: 8 }).withMessage('Password too short, min 8 characters'),
  body('password_confirmation').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('password.not_match')
    }
    return true
  }),
  body('email').isEmail().withMessage('email not valid'),
  handleInputErrors,
  AuthController.createAccount
)

router.post('/confirm-account',
  body('token').notEmpty().withMessage('Token cannot be empty'),
  handleInputErrors,
  AuthController.confirmAccount as any
)

router.post('/login',
  body('email').isEmail().withMessage('Email not valid'),
  body('password').notEmpty().withMessage('password required'),
  handleInputErrors,
  AuthController.login as any
)

router.post('/request-code',
  body('email').isEmail().withMessage('Email not valid'),
  handleInputErrors,
  AuthController.requestConfirmationCode as any
)

router.post('/forgot-password',
  body('email').isEmail().withMessage('Email not valid'),
  handleInputErrors,
  AuthController.forgotPassword as any
)

router.post('/validate-token',
  body('token').notEmpty().withMessage('Token cannot be empty'),
  handleInputErrors,
  AuthController.validateToken as any
)

router.post('/update-password/:token',
  param('token').isNumeric().withMessage('Token not valid'),
  body('password').isLength({ min: 8 }).withMessage('Password too short, min 8 characters'),
  body('password_confirmation').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('password.not_match')
    }
    return true
  }),
  handleInputErrors,
  AuthController.updatePasswordWithToken as any
)

router.get('/user',
  authenticate,
  AuthController.user as any
)

/** Profile */
router.put('/profile',
  authenticate,
  body('name').notEmpty().withMessage('name required'),
  body('lastname').notEmpty().withMessage('lastname required'),
  body('email').isEmail().withMessage('Email not valid'),
  handleInputErrors,
  AuthController.updateProfile as any
)

router.post('/profile-image',
  authenticate,
  uploadConfig.single('profileImage'),
  AuthController.updateProfileImage as any
)

router.delete('/profile-image',
  authenticate,
  AuthController.deleteProfileImage
)

router.post('/update-password',
  authenticate,
  body('current_password').notEmpty().withMessage('password required'),
  body('password').isLength({ min: 8 }).withMessage('Password too short, min 8 characters'),
  body('password_confirmation').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('password.not_match')
    }
    return true
  }),
  handleInputErrors,
  AuthController.updateCurrentUserPassword as any
)

router.post('/check-password',
  authenticate,
  body('password').notEmpty().withMessage('passowrd required'),
  handleInputErrors,
  AuthController.checkPassword as any
)

export default router
