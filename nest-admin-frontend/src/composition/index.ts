// @ts-nocheck
import type { Ref } from 'vue'

function action(type: string, dialogRef: Ref, data = {}) {
  switch (type) {
    case 'add':
      dialogRef.value.visible = true
      dialogRef.value.form = data
      break
    case 'edit':
      dialogRef.value.visible = true
      dialogRef.value.form = JSON.parse(JSON.stringify(data))
      break
    case 'del':
      $sdk.confirm().then(() => {
        loading = true
        del(data.id)
          .then(() => {
            getTree()
            $sdk.msgSuccess()
          })
          .finally(() => (loading = false))
      })
      break
  }
}
