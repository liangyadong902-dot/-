import { reactive, ref } from 'vue'
import type { PageResult } from '@/types'

type TableQuery = Record<string, unknown> & {
  page: number
  pageSize: number
}

/**
 * 列表查询：对接统一分页 `{ list, total, page, pageSize }`
 */
export function useTable<T = unknown>(
  api: (params: TableQuery) => Promise<{ data: PageResult<T> }>,
) {
  const loading = ref(false)
  const dataList = ref<T[]>([])
  const total = ref(0)
  const queryParams = reactive<TableQuery>({
    page: 1,
    pageSize: 10,
  })

  const search = async () => {
    loading.value = true
    try {
      const res = await api(queryParams)
      dataList.value = res.data?.list || []
      total.value = res.data?.total || 0
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    queryParams.page = 1
    search()
  }

  const handlePageChange = (page: number) => {
    queryParams.page = page
    search()
  }

  const handleSizeChange = (size: number) => {
    queryParams.pageSize = size
    queryParams.page = 1
    search()
  }

  return {
    loading,
    dataList,
    total,
    queryParams,
    search,
    reset,
    handlePageChange,
    handleSizeChange,
  }
}
