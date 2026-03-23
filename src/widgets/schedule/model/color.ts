function parseHexColor(value: string) {
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

function parseRgbColor(value: string) {
  const match = value.match(/rgba?\(([^)]+)\)/i)
  if (!match) {
    return undefined
  }

  const [red, green, blue] = match[1]
    .split(',')
    .slice(0, 3)
    .map(channel => Number.parseFloat(channel.trim()))

  if ([red, green, blue].some(channel => Number.isNaN(channel))) {
    return undefined
  }

  return { red, green, blue }
}

function getRelativeLuminance(channel: number) {
  const normalized = channel / 255
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4
}

export function getReadableTextColor(background: string) {
  const parsed = parseHexColor(background) ?? parseRgbColor(background)
  if (!parsed) {
    return '#17313e'
  }

  const luminance = 0.2126 * getRelativeLuminance(parsed.red)
    + 0.7152 * getRelativeLuminance(parsed.green)
    + 0.0722 * getRelativeLuminance(parsed.blue)

  return luminance > 0.55 ? '#17313e' : '#f7fafc'
}
