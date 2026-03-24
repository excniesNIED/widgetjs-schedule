interface RGB {
  red: number
  green: number
  blue: number
}

function parseHexColor(value: string): RGB | undefined {
  const normalized = value.trim().replace('#', '')
  if (![3, 6].includes(normalized.length)) {
    return undefined
  }

  const expanded = normalized.length === 3
    ? normalized.split('').map(char => `${char}${char}`).join('')
    : normalized

  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)

  if ([red, green, blue].some(channel => Number.isNaN(channel))) {
    return undefined
  }

  return { red, green, blue }
}

function parseRgbColor(value: string): RGB | undefined {
  const match = value.match(/rgba?\(([^)]+)\)/i)
  if (!match?.[1]) {
    return undefined
  }

  const parts = match[1].split(',').map(channel => Number.parseFloat(channel.trim()))
  if (parts.length < 3 || parts.some(channel => Number.isNaN(channel))) {
    return undefined
  }

  return { red: parts[0] as number, green: parts[1] as number, blue: parts[2] as number }
}

function getRelativeLuminance(channel: number): number {
  const normalized = channel / 255
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4
}

export function getReadableTextColor(background: string): string {
  const parsed = parseHexColor(background) ?? parseRgbColor(background)
  if (!parsed) {
    return 'var(--widget-color)'
  }

  const luminance = 0.2126 * getRelativeLuminance(parsed.red)
    + 0.7152 * getRelativeLuminance(parsed.green)
    + 0.0722 * getRelativeLuminance(parsed.blue)

  return luminance > 0.55 ? '#17313e' : '#f7fafc'
}
