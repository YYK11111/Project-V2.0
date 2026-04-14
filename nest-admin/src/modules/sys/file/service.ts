import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan, In } from 'typeorm'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { SysFile, FileStatus } from './entity'
import { CreateFileDto, AssociateFileDto } from './dto'
import { Cron, CronExpression } from '@nestjs/schedule'

export type CleanupResult = {
  deletedCount: number
  totalSize: number
  details: string[]
}

@Injectable()
export class SysFileService {
  constructor(
    @InjectRepository(SysFile) private readonly repository: Repository<SysFile>,
  ) {}

  async create(dto: CreateFileDto): Promise<SysFile> {
    const file = new SysFile({
      ...dto,
      uploadTime: new Date(),
      status: (dto.status as FileStatus) || FileStatus.Pending,
    })
    return this.repository.save(file)
  }

  async findById(id: string): Promise<SysFile> {
    const file = await this.repository.findOne({ where: { id } })
    if (!file) {
      throw new NotFoundException('附件不存在')
    }
    return file
  }

  async findByPath(storedPath: string): Promise<SysFile | null> {
    return this.repository.findOne({ where: { storedPath } })
  }

  async list(query: any): Promise<{ list: SysFile[]; total: number }> {
    const { businessType, businessId, status, pageNum = 1, pageSize = 10 } = query
    const where: any = {}
    if (businessType) where.businessType = businessType
    if (businessId) where.businessId = businessId
    if (status) where.status = status

    const [list, total] = await this.repository.findAndCount({
      where,
      order: { uploadTime: 'DESC' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    })

    return { list, total }
  }

  async softDelete(id: string): Promise<void> {
    const file = await this.findById(id)
    file.status = FileStatus.Deleted
    file.deletedAt = new Date()
    await this.repository.save(file)
  }

  async softDeleteByPath(storedPath: string): Promise<void> {
    const file = await this.findByPath(storedPath)
    if (file) {
      file.status = FileStatus.Deleted
      file.deletedAt = new Date()
      await this.repository.save(file)
    }
  }

  async restore(id: string): Promise<void> {
    const file = await this.findById(id)
    if (file.status !== FileStatus.Deleted) {
      throw new NotFoundException('只能恢复已删除的附件')
    }
    file.status = FileStatus.Pending
    file.deletedAt = null
    await this.repository.save(file)
  }

  async associateFiles(dto: AssociateFileDto): Promise<void> {
    const { businessType, businessId, fileIds } = dto
    
    await this.repository.update(
      { id: In(fileIds) },
      {
        businessType,
        businessId,
        status: FileStatus.Associated,
      }
    )
  }

  async delete(id: string, deletePhysical = true): Promise<void> {
    const file = await this.findById(id)
    
    if (deletePhysical) {
      await this.deletePhysicalFile(file.storedPath)
    }
    
    await this.repository.remove(file)
  }

  private async deletePhysicalFile(storedPath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), 'upload', storedPath)
      await fs.unlink(fullPath)
    } catch (error) {
      console.error(`Failed to delete physical file: ${storedPath}`, error)
    }
  }

  async cleanupOrphanFiles(hours = 24): Promise<CleanupResult> {
    const threshold = new Date(Date.now() - hours * 60 * 60 * 1000)
    const result: CleanupResult = {
      deletedCount: 0,
      totalSize: 0,
      details: [],
    }

    const pendingFiles = await this.repository.find({
      where: {
        status: FileStatus.Pending,
        uploadTime: LessThan(threshold),
      },
    })

    for (const file of pendingFiles) {
      try {
        await this.deletePhysicalFile(file.storedPath)
        await this.repository.remove(file)
        result.deletedCount++
        result.totalSize += Number(file.fileSize || 0)
        result.details.push(`Deleted pending file: ${file.originalName}`)
      } catch (error) {
        console.error(`Failed to cleanup pending file: ${file.id}`, error)
      }
    }

    const deletedFiles = await this.repository.find({
      where: {
        status: FileStatus.Deleted,
        deletedAt: LessThan(threshold),
      },
    })

    for (const file of deletedFiles) {
      try {
        await this.deletePhysicalFile(file.storedPath)
        await this.repository.remove(file)
        result.deletedCount++
        result.totalSize += Number(file.fileSize || 0)
        result.details.push(`Deleted expired file: ${file.originalName}`)
      } catch (error) {
        console.error(`Failed to cleanup expired file: ${file.id}`, error)
      }
    }

    return result
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledCleanup(): Promise<void> {
    console.log('Running scheduled file cleanup...')
    const result = await this.cleanupOrphanFiles(24)
    console.log(`Cleanup completed: ${result.deletedCount} files deleted, ${result.totalSize} bytes freed`)
  }
}