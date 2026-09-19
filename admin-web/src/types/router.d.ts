import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    sub?: string
    public?: boolean
  }
}
