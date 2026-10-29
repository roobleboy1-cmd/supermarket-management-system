import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layers, Plus, Edit, Trash2, Tag, Boxes } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { categoryBrandService } from '@/services/api/categoryBrandService'
import { useToast } from '@/components/ui/Toast'
import type { Category, Brand } from '@/types'

export const CategoriesBrandsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  // Category state
  const [catModalOpen, setCatModalOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)
  const [catName, setCatName] = React.useState('')
  const [catCode, setCatCode] = React.useState('')
  const [catDesc, setCatDesc] = React.useState('')

  // Brand state
  const [brandModalOpen, setBrandModalOpen] = React.useState(false)
  const [editingBrand, setEditingBrand] = React.useState<Brand | null>(null)
  const [brandName, setBrandName] = React.useState('')
  const [brandCode, setBrandCode] = React.useState('')
  const [brandDesc, setBrandDesc] = React.useState('')

  // Queries
  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryBrandService.getCategories(),
  })

  const { data: brands, isLoading: brandLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: () => categoryBrandService.getBrands(),
  })

  // Category Actions
  const handleOpenCategoryCreate = () => {
    setEditingCategory(null)
    setCatName('')
    setCatCode('')
    setCatDesc('')
    setCatModalOpen(true)
  }

  const handleOpenCategoryEdit = (c: Category) => {
    setEditingCategory(c)
    setCatName(c.name)
    setCatCode(c.code)
    setCatDesc(c.description || '')
    setCatModalOpen(true)
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await categoryBrandService.updateCategory(editingCategory.id, {
          name: catName,
          code: catCode,
          description: catDesc,
        })
        success('Category Updated', `${catName} modified`)
      } else {
        await categoryBrandService.createCategory({
          name: catName,
          code: catCode,
          description: catDesc,
        })
        success('Category Created', `${catName} added`)
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setCatModalOpen(false)
    } catch (err: any) {
      error('Failed to save category', err.message)
    }
  }

  const handleDeleteCategory = async (c: Category) => {
    if (confirm(`Delete category "${c.name}"?`)) {
      try {
        await categoryBrandService.deleteCategory(c.id)
        queryClient.invalidateQueries({ queryKey: ['categories'] })
        success('Category Removed', `${c.name} deleted`)
      } catch (err: any) {
        error('Error', err.message)
      }
    }
  }

  // Brand Actions
  const handleOpenBrandCreate = () => {
    setEditingBrand(null)
    setBrandName('')
    setBrandCode('')
    setBrandDesc('')
    setBrandModalOpen(true)
  }

  const handleOpenBrandEdit = (b: Brand) => {
    setEditingBrand(b)
    setBrandName(b.name)
    setBrandCode(b.code)
    setBrandDesc(b.description || '')
    setBrandModalOpen(true)
  }

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingBrand) {
        await categoryBrandService.updateBrand(editingBrand.id, {
          name: brandName,
          code: brandCode,
          description: brandDesc,
        })
        success('Brand Updated', `${brandName} modified`)
      } else {
        await categoryBrandService.createBrand({
          name: brandName,
          code: brandCode,
          description: brandDesc,
        })
        success('Brand Created', `${brandName} added`)
      }
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      setBrandModalOpen(false)
    } catch (err: any) {
      error('Failed to save brand', err.message)
    }
  }

  const handleDeleteBrand = async (b: Brand) => {
    if (confirm(`Delete brand "${b.name}"?`)) {
      try {
        await categoryBrandService.deleteBrand(b.id)
        queryClient.invalidateQueries({ queryKey: ['brands'] })
        success('Brand Removed', `${b.name} deleted`)
      } catch (err: any) {
        error('Error', err.message)
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories & Product Brands"
        description="Organize merchandise hierarchy, department codes, and supplier brand lines"
      />

      <Tabs defaultValue="categories">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="categories">Categories ({categories?.length || 0})</TabsTrigger>
            <TabsTrigger value="brands">Brands ({brands?.length || 0})</TabsTrigger>
          </TabsList>
        </div>

        {/* CATEGORIES TAB */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={handleOpenCategoryCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(categories || []).map((cat) => (
              <Card key={cat.id} className="hover:border-[#16A34A] transition-all">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#16A34A] dark:text-[#84CC16]">
                        {cat.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenCategoryEdit(cat)}
                          className="p-1 rounded text-[#94A3B8] hover:text-[#16A34A]"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1 rounded text-[#94A3B8] hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-[#111827] dark:text-[#F9FAFB]">{cat.name}</h3>
                    <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-1 line-clamp-2">
                      {cat.description || 'No description provided'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#374151] flex items-center justify-between text-xs text-[#94A3B8]">
                    <span className="flex items-center gap-1 font-medium text-[#334155] dark:text-[#9CA3AF]">
                      <Boxes className="h-3.5 w-3.5 text-[#16A34A]" />
                      {cat.productCount} Products
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* BRANDS TAB */}
        <TabsContent value="brands" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={handleOpenBrandCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Brand
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(brands || []).map((br) => (
              <Card key={br.id} className="hover:border-[#16A34A] transition-all">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        {br.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenBrandEdit(br)}
                          className="p-1 rounded text-[#94A3B8] hover:text-[#16A34A]"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBrand(br)}
                          className="p-1 rounded text-[#94A3B8] hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-[#111827] dark:text-[#F9FAFB]">{br.name}</h3>
                    <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-1 line-clamp-2">
                      {br.description || 'Manufacturer & product line'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#374151] flex items-center justify-between text-xs text-[#94A3B8]">
                    <span className="flex items-center gap-1 font-medium text-[#334155] dark:text-[#9CA3AF]">
                      <Tag className="h-3.5 w-3.5 text-emerald-600" />
                      {br.productCount} Linked Items
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* CATEGORY MODAL */}
      <Dialog
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'New Product Category'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Category Name"
            required
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="e.g. Fresh Produce"
          />
          <Input
            label="Short Code"
            required
            value={catCode}
            onChange={(e) => setCatCode(e.target.value.toUpperCase())}
            placeholder="e.g. PROD"
          />
          <div>
            <label className="block text-xs font-semibold text-[#334155] dark:text-[#9CA3AF] mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              rows={3}
              className="w-full text-xs p-3 rounded-lg border border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#1F2937]"
              placeholder="Merchandise aisle details..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCatModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Category
            </Button>
          </div>
        </form>
      </Dialog>

      {/* BRAND MODAL */}
      <Dialog
        open={brandModalOpen}
        onClose={() => setBrandModalOpen(false)}
        title={editingBrand ? 'Edit Brand' : 'New Brand'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveBrand} className="space-y-4">
          <Input
            label="Brand Name"
            required
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. Almarai"
          />
          <Input
            label="Short Code"
            required
            value={brandCode}
            onChange={(e) => setBrandCode(e.target.value.toUpperCase())}
            placeholder="e.g. ALM"
          />
          <div>
            <label className="block text-xs font-semibold text-[#334155] dark:text-[#9CA3AF] mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={brandDesc}
              onChange={(e) => setBrandDesc(e.target.value)}
              rows={3}
              className="w-full text-xs p-3 rounded-lg border border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#1F2937]"
              placeholder="Brand provenance & manufacturer details..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setBrandModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Brand
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
