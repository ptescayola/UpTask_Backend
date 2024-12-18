import type {Request, Response} from 'express'
import Task from '../models/Task'

export class TaskController {
  static createTask = async (req: Request, res: Response) => {
    try {
      const task = new Task({
        ...req.body,
        project: req.project.id,
        status: req.body.status || 'pending'
      }) 
      req.project.tasks.push(task.id)
      await Promise.allSettled([task.save(), req.project.save() ])

      res.send('task.created')
    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }

  static getProjectTasks = async (req: Request, res: Response) => {
    try {
      const tasks = await Task.find({project: req.project.id}).populate('project')
      res.json(tasks)
    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }

  static getTaskById = async (req: Request, res: Response) => {
    try {
      const task = await Task.findById(req.task.id)
        .populate({path: 'completedBy.user', select: '_id name lastname email profileImage'})
        .populate({path: 'notes', populate: {path: 'createdBy', select: 'id name lastname email profileImage' }})

      res.json(task)
    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }

  static updateTask = async (req: Request, res: Response) => {
    try {
      req.task.name = req.body.name
      req.task.description = req.body.description
      await req.task.save()
      res.send('task.updated')
    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }

  static deleteTask = async (req: Request, res: Response) => {
    try {
      req.project.tasks = req.project.tasks.filter( task => task.toString() !== req.task.id.toString() )
      await Promise.allSettled([ req.task.deleteOne(), req.project.save() ])
      res.send('task.deleted')
    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }

  static updateStatus = async (req: Request, res: Response) => {
    try {
      const { status } = req.body
      req.task.status = status
      const data = {
        user: req.user.id,
        status
      }
      req.task.completedBy.push(data)
      await req.task.save()
      res.send('task.updated')
    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }
}
