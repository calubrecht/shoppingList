import { useEffect, useState } from 'react'
import { post } from '../../api'
import RecipeGrid from '../RecipeGrid'

export default function RecipesDialog({ onClose }) {
  const [recipes, setRecipes] = useState([])

  useEffect(() => {
    post({ action: 'getRecipes' }).then(data => setRecipes(data.recipes ?? []))
  }, [])

  function handleAdd(recipeData) {
    post({ action: 'addRecipe', recipe: recipeData }).then(data => setRecipes(data.recipes ?? []))
  }

  function handleEdit(recipeData) {
    post({ action: 'editRecipe', recipe: recipeData }).then(data => setRecipes(data.recipes ?? []))
  }

  function handleDelete(name) {
    post({ action: 'deleteRecipe', recipe: name }).then(data => setRecipes(data.recipes ?? []))
  }

  function handleReorder(newRecipes) {
    setRecipes(newRecipes)
    post({ action: 'setOrder', orderedItems: newRecipes.map(r => r.id) })
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal recipesModal" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h3>Your Recipes</h3>
        <RecipeGrid
          recipes={recipes}
          queryMode={false}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReorder={handleReorder}
        />
      </div>
    </div>
  )
}
