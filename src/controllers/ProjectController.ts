import type { Request, Response } from 'express'
import Project from '../models/Project'

export class ProjectController {
  static createProject = async (req: Request, res: Response) => {
    const project = new Project(req.body)

    project.manager = req.user.id // Set manager by project 
  
    try {
      await project.save()
      res.send('NEW Project Created!')
    } catch(error) {
      console.log(error)
    }
  }

  static getAllProjects = async (req: Request, res: Response) => {
    try {
      const projects = await Project.find({
        $or: [
          { manager: {$in: req.user.id} }, // get projects by manager
          { team: {$in: req.user.id} }
        ]
      })
      res.json(projects)
    } catch (error) {
      console.log(error)
    }
  }

  static getProjectById = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
      const project = await Project.findById(id).populate('tasks')
      if (!project) {
        const error = new Error('Project not found')
        return res.status(404).json({error: error.message})
      }
      if (project.manager.toString() !== req.user.id.toString() && !project.team.includes(req.user.id)) {
        const error = new Error('Project not found')
        return res.status(404).json({error: error.message})
      }
      res.json(project)
    } catch (error) {
      console.log(error)
    }
  }

  static updateProject = async (req: Request, res: Response) => {
    try {       
      req.project.clientName = req.body.clientName
      req.project.projectName = req.body.projectName
      req.project.description = req.body.description

      await req.project.save()
      res.send('Project Updated!')
    } catch (error) {
      console.log(error)
    }
  }

  static deleteProject = async (req: Request, res: Response) => {
    try {
      await req.project.deleteOne()
      res.send('Project Deleted')
    } catch (error) {
      console.log(error)
    }
  }
}
