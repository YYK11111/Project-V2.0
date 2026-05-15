import { defineComponent, h } from 'vue'
import { ElTimePicker as ElementPlusTimePicker } from 'element-plus'
import 'element-plus/es/components/time-picker/style/css'
import { getTimePickerProps } from '@/utils/common'

export default defineComponent({
  name: 'ElTimePickerWithNow',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        ElementPlusTimePicker,
        {
          ...getTimePickerProps(),
          ...attrs,
        },
        slots,
      )
  },
})
