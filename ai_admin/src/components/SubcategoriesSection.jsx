// Subcategories Section Component for Dashboard
import { useState, useEffect } from 'react'
import { Plus, Eye, Edit, Trash2 } from 'lucide-react'

const SubcategoriesSection = ({ 
  subcategories, 
  categories, 
  openModal, 
  setSubcategories,
  db 
}) => {
  return (
    <div className="section-content">
      <div className="content-grid">
        <div className="content-card full-width">
          <div className="card-header">
            <h3>All Subcategories ({subcategories.length})</h3>
            <button 
              className="header-button"
              onClick={() => openModal('add', { type: 'subcategory' })}
            >
              <Plus size={16} />
              Add Subcategory
            </button>
          </div>
          <div className="items-list">
            {subcategories.map((subcategory) => (
              <div key={subcategory.id} className="list-item">
                <div className="item-info">
                  <div className="item-main">
                    <span className="item-name">{subcategory.name}</span>
                    <span className="item-description">{subcategory.description}</span>
                  </div>
                  <div className="item-meta">
                    <span className="item-category">Category: {subcategory.category_name}</span>
                    <span className="item-count">{subcategory.count} products</span>
                  </div>
                </div>
                <div className="item-actions">
                  <button 
                    className="action-btn view"
                    onClick={() => openModal('view', { ...subcategory, type: 'subcategory' })}
                  >
                    <Eye size={16} /> View
                  </button>
                  <button 
                    className="action-btn edit"
                    onClick={() => openModal('edit', { ...subcategory, type: 'subcategory' })}
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => openModal('delete', { ...subcategory, type: 'subcategory' })}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubcategoriesSection
