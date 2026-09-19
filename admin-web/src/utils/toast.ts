type ToastHandler = (msg: string) => void

let handler: ToastHandler | null = null

export function setToastHandler(fn: ToastHandler | null) {
  handler = fn
}

export function toast(msg: string) {
  handler?.(msg)
}
