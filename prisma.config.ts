import { defineConfig } from '@prisma/config'

export default defineConfig({
  schema: 'database/schema.prisma',
  datasource: {
    url: 'file:database/dev.db'
  }
})
