import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import RecipeCard from './RecipeCard'

export default function RecipeGrid({
  recipes, queryMode, selectedName,
  onSelect, onEdit, onAdd, onDelete, onReorder,
}) {
  const [adding, setAdding] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIdx = recipes.findIndex(r => r.id === active.id)
    const newIdx = recipes.findIndex(r => r.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    onReorder(arrayMove(recipes, oldIdx, newIdx))
  }

  function handleAdd(recipeData) {
    setAdding(false)
    onAdd(recipeData)
  }

  const recipeIds = recipes.map(r => r.id)

  return (
    <div className="recipeGrid">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={recipeIds} strategy={rectSortingStrategy}>
          <div className="recipeCards">
            {recipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                queryMode={queryMode}
                selected={selectedName === recipe.name}
                newRecipe={false}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {adding && (
              <RecipeCard
                key="recipe_NEW"
                recipe={{ id: 'recipe_NEW', name: '', text: '' }}
                queryMode={false}
                selected={false}
                newRecipe
                onAdd={handleAdd}
                onCancelNew={() => setAdding(false)}
              />
            )}
          </div>
        </SortableContext>
      </DndContext>
      {!queryMode && !adding && (
        <button type="button" onClick={() => setAdding(true)}>Add Recipe</button>
      )}
    </div>
  )
}
