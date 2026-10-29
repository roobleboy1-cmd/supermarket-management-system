import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Truck, Plus, Mail, Phone, MapPin, DollarSign, Edit, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { supplierService } from '@/services/api/supplierService'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency } from '@/utils/formatters'
import type { Supplier } from '@/types'

export const SuppliersPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null)

  // Form Fields
  const [name, setName] = React.useState('')
  const [contactPerson, setContactPerson] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [taxId, setTaxId] = React.useState('')
  const [paymentTerms, setPaymentTerms] = React.useState('Net 30 Days')
  const [status, setStatus] = React.useState<'active' | 'inactive'>('active')

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getSuppliers(),
  })

  const handleOpenCreate = () => {
    setEditingSupplier(null)
    setName('')
    setContactPerson('')
    setEmail('')
    setPhone('')
    setAddress('')
    setTaxId('')
    setPaymentTerms('Net 30 Days')
    setStatus('active')
    setModalOpen(true)
  }

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup)
    setName(sup.name)
    setContactPerson(sup.contactPerson)
    setEmail(sup.email)
    setPhone(sup.phone)
    setAddress(sup.address)
    setTaxId(sup.taxId || '')
    setPaymentTerms(sup.paymentTerms)
    setStatus(sup.status)
    setModalOpen(true)
  }

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier.id, {
          name,
          contactPerson,
          email,
          phone,
          address,
          taxId,
          paymentTerms,
          status,
        })
        success('Supplier Updated', `${name} details modified`)
      } else {
        await supplierService.createSupplier({
          name,
          contactPerson,
          email,
          phone,
          address,
          taxId,
          paymentTerms,
          status,
        })
        success('Supplier Registered', `${name} added to vendor directory`)
      }
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setModalOpen(false)
    } catch (err: any) {
      error('Failed to save supplier', err.message)
    }
  }

  const handleDelete = async (sup: Supplier) => {
    if (confirm(`Remove supplier "${sup.name}"?`)) {
      try {
        await supplierService.deleteSupplier(sup.id)
        queryClient.invalidateQueries({ queryKey: ['suppliers'] })
        success('Supplier Deleted', `${sup.name} removed`)
      } catch (err: any) {
        error('Error', err.message)
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers & Vendor Directory"
        description="FMCG suppliers, credit terms, payables balance, and procurement contacts"
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Supplier
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="col-span-full py-12 text-center text-xs text-[#94A3B8]">Loading vendors...</p>
        ) : (
          (suppliers || []).map((sup) => (
            <Card key={sup.id} className="hover:border-blue-500 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {sup.name}
                    </CardTitle>
                    <p className="text-xs text-[#64748B] mt-0.5">Contact: {sup.contactPerson}</p>
                  </div>
                  <Badge variant={sup.status === 'active' ? 'success' : 'secondary'} size="sm">
                    {sup.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[#94A3B8]" />
                  <span>{sup.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-[#94A3B8]" />
                  <span className="truncate">{sup.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
                  <span className="truncate">{sup.address}</span>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block">Terms: {sup.paymentTerms}</span>
                    <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      Balance: {formatCurrency(sup.currentBalance)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sup)}
                      className="p-1 rounded text-[#94A3B8] hover:text-blue-600"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sup)}
                      className="p-1 rounded text-[#94A3B8] hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* SUPPLIER MODAL */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'New Supplier'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <Input
            label="Supplier / Company Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Somali Wholesale Logistics Ltd"
          />
          <Input
            label="Primary Contact Person"
            required
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="e.g. Abdirahman Ghedi"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sales@vendor.so"
            />
            <Input
              label="Phone Number"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+252 61..."
            />
          </div>
          <Input
            label="Physical Depot / Warehouse Address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Bakaara Market Depot A"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tax / VAT ID"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="e.g. TAX-WH-1029"
            />
            <Input
              label="Payment Terms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="e.g. Net 30 Days"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Supplier
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
