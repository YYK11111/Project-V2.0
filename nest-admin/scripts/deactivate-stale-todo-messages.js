require('ts-node/register/transpile-only')

if (!process.argv.some((arg) => arg.includes('env='))) {
  process.argv.push('env=dev')
}

const mysql = require('mysql2/promise')
const { config } = require('../config')

async function main() {
  const connection = await mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.username,
    password: config.database.password,
    database: config.database.database,
  })

  try {
    const [result] = await connection.query(`
      UPDATE sys_message m
      LEFT JOIN wf_task t ON t.id = CAST(m.source_id AS UNSIGNED)
      SET m.is_active = '0',
          m.is_read = '1',
          m.read_time = NOW()
      WHERE m.source_type = 'workflow_task'
        AND m.message_type = 'todo'
        AND m.is_delete IS NULL
        AND m.is_active = '1'
        AND (t.id IS NULL OR t.status <> '1')
    `)
    console.log(JSON.stringify({ affectedRows: result.affectedRows }, null, 2))
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
