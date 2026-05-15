import { defineComponent, h } from 'vue'
import { ElDatePicker as ElementPlusDatePicker } from 'element-plus'
import 'element-plus/es/components/date-picker/style/css'
import { getDatePickerProps } from '@/utils/common'

export default defineComponent({
  name: 'ElDatePickerWithNow',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        ElementPlusDatePicker,
        {
          ...getDatePickerProps(String(attrs.type || 'date')),
          ...attrs,
        },
        slots,
      )
  },
})
