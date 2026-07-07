export function parseShopList(data) {
  const aisles = {}
  const itemAisleOrder = []
  for (const item of data.workingList ?? []) {
    const name = item.aisle ?? 'UNKNOWN'
    if (!aisles[name]) {
      aisles[name] = { id: `aisle_${name.replace(/[^a-zA-Z0-9]/g, '_')}`, items: [] }
      itemAisleOrder.push(name)
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
  // The server's aisleOrder is authoritative (it also carries empty aisles), but
  // fall back to the item-derived order if it's missing, and fold in any aisle
  // that only shows up on an item in case the two ever drift apart.
  const aisleOrder = data.aisleOrder?.length ? [...data.aisleOrder] : [...itemAisleOrder]
  for (const name of itemAisleOrder) {
    if (!aisleOrder.includes(name)) aisleOrder.push(name)
  }
  for (const name of aisleOrder) {
    if (!aisles[name]) aisles[name] = { id: `aisle_${name.replace(/[^a-zA-Z0-9]/g, '_')}`, items: [] }
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
