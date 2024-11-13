import { Router } from 'express'
import { ProjectController } from '../controllers/ProjectController'
import { body, param } from 'express-validator'
import { handleInputErrors } from '../middleware/validation'
import { TaskController } from '../controllers/TaskController'
import { projectExists } from '../middleware/project'
import { taskBelongsToProject, taskExists, hasAuthorization } from '../middleware/task'
import { authenticate } from '../middleware/auth'
import { TeamMemberController } from '../controllers/TeamController'
// import { NoteController } from '../controllers/NoteController'

const router = Router()
router.use(authenticate) // Express middleware to protect all endpoints

router.post('/',
  body('projectName').notEmpty().withMessage('projectName is required'),
  body('clientName').notEmpty().withMessage('clientName is required'),
  body('description').notEmpty().withMessage('description is required'),
  handleInputErrors,
  ProjectController.createProject
)

router.get('/', ProjectController.getAllProjects)

router.get('/:id',
  param('id').isMongoId().withMessage('Id not valid'),
  handleInputErrors,
  ProjectController.getProjectById as any
)

/** Routes for tasks */
router.param('projectId', projectExists)

router.put('/:projectId',
  param('projectId').isMongoId().withMessage('ID not valid'),
  body('projectName').notEmpty().withMessage('projectName is required'),
  body('clientName').notEmpty().withMessage('clientName is required'),
  body('description').notEmpty().withMessage('description is required'),
  handleInputErrors,
  hasAuthorization,
  ProjectController.updateProject as any
)

router.delete('/:projectId',
  param('projectId').isMongoId().withMessage('ID not valid'),
  handleInputErrors,
  hasAuthorization,
  ProjectController.deleteProject
)

router.post('/:projectId/tasks',
  body('name').notEmpty().withMessage('name is required'),
  body('description').notEmpty().withMessage('description is required'),
  handleInputErrors,
  hasAuthorization,
  TaskController.createTask
)

router.get('/:projectId/tasks',
  TaskController.getProjectTasks
)

router.param('taskId', taskExists)
router.param('taskId', taskBelongsToProject)

router.get('/:projectId/tasks/:taskId',
  param('taskId').isMongoId().withMessage('ID not valid'),
  handleInputErrors,
  TaskController.getTaskById
)

router.put('/:projectId/tasks/:taskId',
  param('taskId').isMongoId().withMessage('Id not valid'),
  body('name').notEmpty().withMessage('name required'),
  body('description').notEmpty().withMessage('description required'),
  handleInputErrors,
  hasAuthorization,
  TaskController.updateTask
)

router.delete('/:projectId/tasks/:taskId',
  param('taskId').isMongoId().withMessage('ID not valid'),
  handleInputErrors,
  hasAuthorization,
  TaskController.deleteTask
)

router.post('/:projectId/tasks/:taskId/status', 
  param('taskId').isMongoId().withMessage('ID not valid'),
  body('status').notEmpty().withMessage('status required'),
  handleInputErrors,
  TaskController.updateStatus
)

/** Routes for teams */
router.post('/:projectId/team/find',
  body('email').isEmail().toLowerCase().withMessage('Email not valid'),
  handleInputErrors,
  TeamMemberController.findMemberByEmail as any
)

router.get('/:projectId/team',
  TeamMemberController.getProjecTeam
)

router.post('/:projectId/team',
  body('id').isMongoId().withMessage('Id not valid'),
  handleInputErrors,
  TeamMemberController.addMemberById as any
)

router.delete('/:projectId/team/:userId',
  param('userId').isMongoId().withMessage('Id not valid'),
  handleInputErrors,
  TeamMemberController.removeMemberById as any
)

export default router
