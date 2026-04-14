import { register } from 'tsconfig-paths'
register({
  baseUrl: '.',
  paths: {
    'src/*': ['src/*'],
    'config': ['config/index'],
    'config/*': ['config/*']
  }
})

import { NestFactory } from '@nestjs/core'
import { json, urlencoded } from 'express'
import { AppModule } from './app.module'
import { GlobalInterceptor } from './common/interceptor/GlobalInterceptor'
import { GlobalExceptionsFilter } from './common/filters/GlobalExceptionsFilter'
import compression from 'compression'
import { config } from 'config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false })

  app.use(json({ limit: '10mb' }))
  app.use(urlencoded({ extended: true, limit: '10mb' }))

  app.enableCors()
  app.setGlobalPrefix(config.apiBase)

  app.useGlobalInterceptors(new GlobalInterceptor())
  app.useGlobalFilters(new GlobalExceptionsFilter())

  app.use(compression())

  await app.listen(3000)
  console.log(`localhost:3000 启动成功`)
}

bootstrap()