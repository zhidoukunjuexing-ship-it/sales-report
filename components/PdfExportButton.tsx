'use client'

import { useState } from 'react'

export function PdfExportButton() {
  const [printing, setPrinting] = useState(false)

  const handlePrint = () => {
    setPrinting(true)
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 100)
  }

  return (
    <button
      onClick={handlePrint}
      disabled={printing}
      className="flex items-center gap-2 bg-gray-800 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-gray-900 disabled:opacity-50 transition-colors print:hidden"
    >
      <span>📄</span>
      {printing ? '準備中...' : 'PDFで出力'}
    </button>
  )
}
