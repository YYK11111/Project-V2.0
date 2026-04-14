-- 附件管理表
CREATE TABLE IF NOT EXISTS sys_file (
  id VARCHAR(36) PRIMARY KEY DEFAULT(UUID()),
  original_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
  stored_name VARCHAR(255) NOT NULL COMMENT '存储文件名',
  stored_path VARCHAR(500) NOT NULL COMMENT '存储路径(相对路径)',
  file_size BIGINT COMMENT '文件大小(字节)',
  mime_type VARCHAR(100) COMMENT 'MIME类型',
  business_type VARCHAR(50) COMMENT '业务类型: avatar/project/task/ticket/change/document',
  business_id VARCHAR(36) COMMENT '关联业务ID',
  uploader_id VARCHAR(36) COMMENT '上传人ID',
  upload_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-待关联, 1-已关联, 2-已删除',
  deleted_at DATETIME COMMENT '删除时间',
  INDEX idx_business (business_type, business_id),
  INDEX idx_status (status),
  INDEX idx_upload_time (upload_time),
  INDEX idx_deleted (deleted_at)
) COMMENT '附件管理表';