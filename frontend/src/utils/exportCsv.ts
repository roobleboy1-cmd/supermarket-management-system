export function exportToCsv<T extends Record<string, any>>(
  filename: string,
  rows: T[],
  columns: { header: string; key: keyof T | ((item: T) => any) }[]
) {
  if (!rows || !rows.length) {
    alert('No data to export.')
    return
  }

  const headerRow = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',')
  const dataRows = rows.map((row) =>
    columns
      .map((col) => {
        let val = typeof col.key === 'function' ? col.key(row) : row[col.key]
        if (val === null || val === undefined) val = ''
        const str = String(val).replace(/"/g, '""')
        return `"${str}"`
      })
      .join(',')
  )

  const csvContent = [headerRow, ...dataRows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function parseCsvFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) {
        resolve([])
        return
      }
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
      if (lines.length < 2) {
        resolve([])
        return
      }
      const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim())
      const data: Record<string, string>[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.replace(/^["']|["']$/g, '').trim())
        const item: Record<string, string> = {}
        headers.forEach((header, idx) => {
          item[header] = values[idx] || ''
        })
        data.push(item)
      }
      resolve(data)
    }
    reader.onerror = (err) => reject(err)
    reader.readAsText(file)
  })
}
