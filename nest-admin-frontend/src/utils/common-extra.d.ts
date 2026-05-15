declare module '@/utils/common' {
  export function getDatePickerShortcuts(type?: string): Array<{
    text: string
    value: () => Date | Date[]
  }>

  export function getDatePickerProps(type?: string): {
    showNow: boolean
    shortcuts: Array<{
      text: string
      value: () => Date | Date[]
    }>
  }

  export function getTimePickerProps(): {
    showNow: boolean
  }
}
