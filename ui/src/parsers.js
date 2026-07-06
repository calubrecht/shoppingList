export function parseShopList(data) {
  const aisleOrder = []
  const aisles = {}
  for (const item of data.workingList ?? []) {
    const name = item.aisle ?? 'UNKNOWN'
    if (!aisles[name]) {
      aisles[name] = { id: `aisle_${name.replace(/[^a-zA-Z0-9]/g, '_')}`, items: [] }
      aisleOrder.push(name)
    }
    aisles[name].items.push({
      id: item.id,
      name: item.name,
      count: item.count,
      enabled: item.active,
      done: item.done,
      aisle: name,
    })
  }
  return { aisleOrder, aisles }
}

export function parseMenu(data) {
  const menu = { Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] }
  for (const item of data.menu ?? []) {
    const day = item.aisle
    if (menu[day]) menu[day].push({ id: item.id, name: item.name })
  }
  return menu
}
