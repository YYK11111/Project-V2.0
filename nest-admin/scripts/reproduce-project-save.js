require('ts-node/register/transpile-only')
require('tsconfig-paths/register')

if (!process.argv.some((arg) => arg.includes('env='))) {
  process.argv.push('env=dev')
}

const { DataSource } = require('typeorm')
const { config } = require('../config')
const { Project } = require('../src/modulesBusi/projects/entity')
const { ProjectMember } = require('../src/modulesBusi/project-members/entity')
const { Milestone } = require('../src/modulesBusi/milestones/entity')
const { User } = require('../src/modules/users/entities/user.entity')
const { Customer } = require('../src/modulesBusi/crm/customers/entity')

async function main() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.database,
    entities: [Project, ProjectMember, Milestone, User, Customer],
    synchronize: false,
    logging: ['error', 'query'],
  })

  await dataSource.initialize()
  try {
    await dataSource.transaction(async (manager) => {
      const projectRepository = manager.getRepository(Project)
      const projectMemberRepository = manager.getRepository(ProjectMember)
      const milestoneRepository = manager.getRepository(Milestone)

      const project = await projectRepository.save(new Project({
        name: `复现项目-${Date.now()}`,
        code: `REPRO-${Date.now()}`,
        leaderId: '1',
        startDate: '2026-04-15',
        endDate: '2026-04-16',
        status: '1',
        projectType: '1',
        priority: '2',
        description: '',
        budget: 0,
        actualCost: 0,
        progress: 0,
        createUser: 'system',
      }))

      await projectMemberRepository.save(new ProjectMember({
        projectId: project.id,
        userId: '1',
        role: '1',
        isCore: '1',
        isActive: '1',
        remark: '',
        sort: 10,
        createUser: 'system',
      }))

      await milestoneRepository.save(new Milestone({
        projectId: project.id,
        name: '项目启动',
        description: '',
        dueDate: '2026-04-16',
        completedDate: null,
        status: '1',
        deliverables: [],
        sort: 10,
        createUser: 'system',
      }))

      console.log(JSON.stringify({ projectId: project.id }, null, 2))
      throw new Error('ROLLBACK_FOR_TEST')
    })
  } catch (error) {
    if (error.message === 'ROLLBACK_FOR_TEST') {
      console.log('reproduce succeeded')
      return
    }
    console.error(error)
    process.exitCode = 1
  } finally {
    await dataSource.destroy()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
