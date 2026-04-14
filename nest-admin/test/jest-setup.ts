if (!process.argv.some((arg) => arg.includes('env='))) {
  process.argv.push('env=dev')
}
