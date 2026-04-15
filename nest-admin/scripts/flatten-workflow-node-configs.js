require('ts-node/register/transpile-only')

if (!process.argv.some((arg) => arg.includes('env='))) {
  process.argv.push('env=dev')
}

const mysql = require('mysql2/promise')

const { config } = require('../config')

function normalizeNodeProperties(node) {
  const properties = node?.properties || {}

  if (node?.type === 'approval') {
    const legacyConfig = properties.approverConfig || {}
    const { approverConfig, ...restProperties } = properties
    return {
      assigneeType: 'business_field',
      assigneeValue: '',
      departmentId: '',
      departmentMode: 'leader',
      fieldPath: '',
      businessType: restProperties.businessType || legacyConfig.businessType || '',
      assigneeEmptyAction: 'error',
      assigneeEmptyFallbackUserId: '',
      assigneeEmptyFallbackFieldPath: '',
      multiInstanceType: 'sequential',
      ...legacyConfig,
      ...restProperties,
      allowRollback: restProperties.allowRollback ?? true,
    }
  }

  if (node?.type === 'notification') {
    const legacyConfig = properties.notificationConfig || {}
    const { notificationConfig, ...restProperties } = properties
    return {
      notificationType: 'system',
      notificationTemplate: '',
      notificationContent: '',
      assigneeType: 'business_field',
      assigneeValue: '',
      departmentId: '',
      departmentMode: 'leader',
      fieldPath: '',
      businessType: restProperties.businessType || legacyConfig.businessType || '',
      assigneeEmptyAction: 'skip',
      assigneeEmptyFallbackUserId: '',
      assigneeEmptyFallbackFieldPath: '',
      multiInstanceType: 'sequential',
      ...legacyConfig,
      ...restProperties,
    }
  }

  if (node?.type === 'cc') {
    const legacyConfig = properties.ccConfig || {}
    const { ccConfig, ...restProperties } = properties
    return {
      assigneeType: 'business_field',
      assigneeValue: '',
      departmentId: '',
      departmentMode: 'leader',
      fieldPath: '',
      businessType: restProperties.businessType || legacyConfig.businessType || '',
      assigneeEmptyAction: 'error',
      assigneeEmptyFallbackUserId: '',
      assigneeEmptyFallbackFieldPath: '',
      multiInstanceType: 'parallel',
      ...legacyConfig,
      ...restProperties,
    }
  }

  return properties
}

function normalizeNodes(nodes) {
  if (!Array.isArray(nodes)) return nodes
  return nodes.map((node) => ({
    ...node,
    properties: normalizeNodeProperties(node),
  }))
}

async function main() {
  const connection = await mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.username,
    password: config.database.password,
    database: config.database.database,
  })

  try {
    const [rows] = await connection.query(
      'SELECT id, code, nodes FROM wf_definition WHERE is_delete IS NULL',
    )

    let updatedCount = 0

    for (const row of rows) {
      let parsedNodes
      try {
        parsedNodes = typeof row.nodes === 'string' ? JSON.parse(row.nodes) : row.nodes
      } catch (error) {
        console.warn(`[skip] wf_definition#${row.id} ${row.code} nodes 解析失败: ${error.message}`)
        continue
      }

      const normalizedNodes = normalizeNodes(parsedNodes)
      const before = JSON.stringify(parsedNodes)
      const after = JSON.stringify(normalizedNodes)
      if (before === after) continue

      await connection.query('UPDATE wf_definition SET nodes = ? WHERE id = ?', [after, row.id])
      updatedCount += 1
      console.log(`[update] wf_definition#${row.id} ${row.code}`)
    }

    console.log(`[done] updated ${updatedCount} workflow definitions`)
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
