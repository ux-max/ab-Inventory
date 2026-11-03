import React from "react"

// Code 128 (Subset B) character patterns (107 patterns, index 0 to 106)
const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
]

export interface Barcode128Props {
  value: string
  height?: number
  barWidth?: number
  showText?: boolean
  className?: string
}

export const Barcode128: React.FC<Barcode128Props> = ({
  value,
  height = 50,
  barWidth = 2,
  showText = true,
  className = "w-full h-auto text-black"
}) => {
  const clean = (value || "").replace(/[^\x20-\x7E]/g, "") || "ITEM"

  // Code 128 Subset B encoding
  let sum = 104 // Start B
  const codes: number[] = [104]

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32
    codes.push(code)
    sum += code * (i + 1)
  }

  codes.push(sum % 103) // Checksum
  codes.push(106) // Stop code

  let currentX = 10
  const bars: Array<{ x: number; width: number }> = []

  codes.forEach(c => {
    const pattern = CODE128_PATTERNS[c] || CODE128_PATTERNS[0]
    for (let i = 0; i < pattern.length; i++) {
      const w = parseInt(pattern[i], 10) * barWidth
      if (i % 2 === 0) {
        bars.push({ x: currentX, width: w })
      }
      currentX += w
    }
  })

  const totalWidth = currentX + 10
  const svgHeight = showText ? height + 16 : height

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${svgHeight}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      {bars.map((bar, idx) => (
        <rect
          key={idx}
          x={bar.x}
          y={0}
          width={bar.width}
          height={height}
          fill="currentColor"
        />
      ))}
      {showText && (
        <text
          x={totalWidth / 2}
          y={height + 12}
          textAnchor="middle"
          fontFamily="monospace"
          fontSize={11}
          fontWeight={600}
          fill="currentColor"
          letterSpacing="1.5px"
        >
          {clean}
        </text>
      )}
    </svg>
  )
}

// -------------------------------------------------------------
// QR Code Generator (Versions 1-4, Byte Mode, EC Level M)
// -------------------------------------------------------------
const EXP: number[] = new Array(512).fill(0)
const LOG: number[] = new Array(256).fill(0)
let x = 1
for (let i = 0; i < 255; i++) {
  EXP[i] = x
  LOG[x] = i
  x <<= 1
  if (x & 256) x ^= 0x11d
}
for (let i = 255; i < 512; i++) {
  EXP[i] = EXP[i - 255]
}

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]
}

function polyMul(p1: number[], p2: number[]): number[] {
  const r: number[] = new Array(p1.length + p2.length - 1).fill(0)
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      r[i + j] ^= gfMul(p1[i], p2[j])
    }
  }
  return r
}

function rsCompute(data: number[], numEc: number): number[] {
  let gen: number[] = [1]
  for (let i = 0; i < numEc; i++) {
    gen = polyMul(gen, [1, EXP[i]])
  }
  const msg: number[] = [...data, ...new Array(numEc).fill(0)]
  for (let i = 0; i < data.length; i++) {
    const c = msg[i]
    if (c !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], c)
      }
    }
  }
  return msg.slice(data.length)
}

interface QRVersionConfig {
  ver: number
  size: number
  totalCodewords: number
  ecCodewords: number
  dataCodewords: number
  align: number[]
}

const QR_VERSIONS: QRVersionConfig[] = [
  { ver: 1, size: 21, totalCodewords: 26, ecCodewords: 10, dataCodewords: 16, align: [] },
  { ver: 2, size: 25, totalCodewords: 44, ecCodewords: 16, dataCodewords: 28, align: [6, 18] },
  { ver: 3, size: 29, totalCodewords: 70, ecCodewords: 26, dataCodewords: 44, align: [6, 22] },
  { ver: 4, size: 33, totalCodewords: 100, ecCodewords: 36, dataCodewords: 64, align: [6, 26] }
]

export function generateQRMatrix(text: string): boolean[][] {
  const clean = text || "ITEM"
  const bytes = new TextEncoder().encode(clean)
  let verConfig = QR_VERSIONS.find(v => v.dataCodewords >= bytes.length + 3) || QR_VERSIONS[QR_VERSIONS.length - 1]

  const bitBuf: number[] = []
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bitBuf.push((val >> i) & 1)
  }

  // Byte mode indicator (0100) + 8-bit length
  pushBits(4, 4)
  pushBits(bytes.length, 8)
  for (let b of bytes) pushBits(b, 8)

  // Terminator
  const maxBits = verConfig.dataCodewords * 8
  const termLen = Math.min(4, maxBits - bitBuf.length)
  pushBits(0, termLen)

  // Pad to byte
  while (bitBuf.length % 8 !== 0) bitBuf.push(0)

  // Pad bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11]
  let padIdx = 0
  while (bitBuf.length < maxBits) {
    pushBits(padBytes[padIdx % 2], 8)
    padIdx++
  }

  const dataBytes: number[] = new Array(verConfig.dataCodewords).fill(0)
  for (let i = 0; i < dataBytes.length; i++) {
    let b = 0
    for (let k = 0; k < 8; k++) b = (b << 1) | bitBuf[i * 8 + k]
    dataBytes[i] = b
  }

  const ecBytes = rsCompute(dataBytes, verConfig.ecCodewords)
  const total: number[] = [...dataBytes, ...ecBytes]

  const size = verConfig.size
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null))
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))

  const setModule = (r: number, c: number, val: boolean, func = true) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val
      if (func) isFunction[r][c] = true
    }
  }

  // 1. Finder patterns
  const placeFinder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = r0 + r, nc = c0 + c
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue
        const inOuter = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6))
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4
        setModule(nr, nc, inOuter || inInner, true)
      }
    }
  }
  placeFinder(0, 0)
  placeFinder(0, size - 7)
  placeFinder(size - 7, 0)

  // 2. Alignment patterns
  if (verConfig.align.length > 0) {
    const coords = verConfig.align
    for (const r of coords) {
      for (const c of coords) {
        if (
          (r <= 8 && c <= 8) ||
          (r <= 8 && c >= size - 8) ||
          (r >= size - 8 && c <= 8)
        ) continue

        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2
            const isCenter = dr === 0 && dc === 0
            setModule(r + dr, c + dc, isBorder || isCenter, true)
          }
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setModule(6, i, i % 2 === 0, true)
    if (!isFunction[i][6]) setModule(i, 6, i % 2 === 0, true)
  }

  // 4. Dark module
  setModule(size - 8, 8, true, true)

  // 5. Reserve format info
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      isFunction[8][i] = true
      isFunction[i][8] = true
    }
  }
  for (let i = size - 8; i < size; i++) isFunction[8][i] = true
  for (let i = size - 7; i < size; i++) isFunction[i][8] = true

  // 6. Data bits with Mask 0 ((r + c) % 2 === 0)
  let bitIdx = 0
  const allBits: number[] = []
  for (let b of total) {
    for (let k = 7; k >= 0; k--) allBits.push((b >> k) & 1)
  }

  let upward = true
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--
    const cols = [right, right - 1]
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i)

    for (const r of rows) {
      for (const c of cols) {
        if (!isFunction[r][c]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0
          const mask = (r + c) % 2 === 0
          matrix[r][c] = (bit ^ (mask ? 1 : 0)) === 1
        }
      }
    }
    upward = !upward
  }

  // 7. Format info for EC Level M (00) & Mask 0 (000) -> 0x5412
  const fmt = 0x5412
  const fmtBits: number[] = []
  for (let i = 14; i >= 0; i--) fmtBits.push((fmt >> i) & 1)

  const topCols = [0, 1, 2, 3, 4, 5, 7, 8]
  for (let i = 0; i < 8; i++) setModule(8, topCols[i], fmtBits[i] === 1, true)
  const leftRows = [8, 7, 5, 4, 3, 2, 1, 0]
  for (let i = 0; i < 8; i++) setModule(leftRows[i], 8, fmtBits[14 - i] === 1, true)

  for (let i = 0; i < 7; i++) setModule(size - 1 - i, 8, fmtBits[i] === 1, true)
  for (let i = 0; i < 8; i++) setModule(8, size - 8 + i, fmtBits[7 + i] === 1, true)

  return matrix.map(row => row.map(cell => cell === true))
}

export interface QRCodeProps {
  value: string
  size?: number
  className?: string
}

export const QRCodeSVG: React.FC<QRCodeProps> = ({
  value,
  size = 120,
  className = "w-full h-auto text-black"
}) => {
  const matrix = React.useMemo(() => generateQRMatrix(value), [value])
  const matrixSize = matrix.length
  const margin = 2
  const totalDim = matrixSize + margin * 2

  // Build combined SVG path for crisp rendering
  let path = ""
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        path += `M${c + margin},${r + margin}h1v1h-1z `
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${totalDim} ${totalDim}`}
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      <path d={path} fill="currentColor" />
    </svg>
  )
}
