import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SysFileService } from './service'
import { SysFile, FileStatus } from './entity'

describe('SysFileService', () => {
  let service: SysFileService
  let repository: Repository<SysFile>

  const mockRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SysFileService,
        {
          provide: getRepositoryToken(SysFile),
          useValue: mockRepository,
        },
      ],
    }).compile()

    service = module.get<SysFileService>(SysFileService)
    repository = module.get<Repository<SysFile>>(getRepositoryToken(SysFile))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new file record with Pending status', async () => {
      const dto = {
        originalName: 'test.pdf',
        storedName: 'abc123.pdf',
        storedPath: 'abc123.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
      }

      const expectedFile = {
        id: '1',
        ...dto,
        uploadTime: expect.any(Date),
        status: FileStatus.Pending,
      }

      mockRepository.save.mockResolvedValue(expectedFile)

      const result = await service.create(dto)

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          originalName: dto.originalName,
          storedName: dto.storedName,
          storedPath: dto.storedPath,
          status: FileStatus.Pending,
        }),
      )
      expect(result).toEqual(expectedFile)
    })
  })

  describe('associateFiles', () => {
    it('should associate files with business record and update status to Associated', async () => {
      const dto = {
        businessType: 'project',
        businessId: '123',
        fileIds: ['file1', 'file2'],
      }

      mockRepository.update.mockResolvedValue({ affected: 2 })

      await service.associateFiles(dto)

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: ['file1', 'file2'] },
        {
          businessType: 'project',
          businessId: '123',
          status: FileStatus.Associated,
        },
      )
    })
  })

  describe('softDelete', () => {
    it('should soft delete a file by setting status to Deleted', async () => {
      const mockFile = {
        id: '1',
        originalName: 'test.pdf',
        status: FileStatus.Associated,
      }

      mockRepository.findOne.mockResolvedValue(mockFile)
      mockRepository.save.mockResolvedValue({ ...mockFile, status: FileStatus.Deleted })

      await service.softDelete('1')

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } })
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: FileStatus.Deleted,
          deletedAt: expect.any(Date),
        }),
      )
    })
  })

  describe('restore', () => {
    it('should restore a deleted file to Pending status', async () => {
      const mockFile = {
        id: '1',
        originalName: 'test.pdf',
        status: FileStatus.Deleted,
        deletedAt: new Date(),
      }

      mockRepository.findOne.mockResolvedValue(mockFile)
      mockRepository.save.mockResolvedValue({ ...mockFile, status: FileStatus.Pending, deletedAt: null })

      await service.restore('1')

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: FileStatus.Pending,
          deletedAt: null,
        }),
      )
    })
  })

  describe('cleanupOrphanFiles', () => {
    it('should return cleanup result', async () => {
      mockRepository.find.mockResolvedValue([])

      const result = await service.cleanupOrphanFiles(24)

      expect(result).toEqual({
        deletedCount: 0,
        totalSize: 0,
        details: [],
      })
    })
  })
})