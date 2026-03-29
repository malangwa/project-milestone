import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { attachmentsApi } from '../../api/attachments.api';
import { materialRequestsApi } from '../../api/material-requests.api';
import {
  goodsReceiptsApi,
  inventoryApi,
  purchaseOrdersApi,
  supplierInvoicesApi,
  suppliersApi,
} from '../../api/procurement.api';
import type {
  GoodsReceipt,
  GoodsReceiptDestinationType,
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  SupplierInvoice,
  StockStatus,
  StockItem,
  StockMovement,
} from '../../types/procurement.types';
import type { MaterialRequest } from '../../types/project.types';

type OrderFormItem = {
  id: string;
  name: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  notes: string;
};

type PurchaseOrderForm = {
  supplierId: string;
  title: string;
  materialRequestId: string;
  notes: string;
  taxAmount: string;
  items: OrderFormItem[];
};

type InvoiceForm = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  notes: string;
  fileUrl: string;
};

type ReceiptFormItem = {
  purchaseOrderItemId?: string;
  name: string;
  unit: string;
  orderedQuantity: string;
  receivedQuantity: string;
  damagedQuantity: string;
  notes: string;
};

type ReceiptForm = {
  notes: string;
  destinationType: GoodsReceiptDestinationType;
  destinationLabel: string;
  items: ReceiptFormItem[];
};

type AdjustForm = {
  name: string;
  unit: string;
  quantity: string;
  reorderLevel: string;
  location: string;
  notes: string;
};

type ProcurementPanelProps = {
  projectId: string;
  canApprove: boolean;
  canEdit: boolean;
  initialMaterialRequestId?: string | null;
};

const emptyOrderItem = (): OrderFormItem => ({
  id: crypto.randomUUID(),
  name: '',
  description: '',
  quantity: '1',
  unit: '',
  unitPrice: '',
  notes: '',
});

const emptyPurchaseOrderForm = (): PurchaseOrderForm => ({
  supplierId: '',
  title: '',
  materialRequestId: '',
  notes: '',
  taxAmount: '',
  items: [emptyOrderItem()],
});

const emptyInvoiceForm = (): InvoiceForm => ({
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  subtotal: '',
  taxAmount: '',
  totalAmount: '',
  notes: '',
  fileUrl: '',
});

const emptyReceiptForm = (): ReceiptForm => ({
  notes: '',
  destinationType: 'store',
  destinationLabel: 'Main Store',
  items: [],
});

const emptyAdjustForm = (): AdjustForm => ({
  name: '',
  unit: '',
  quantity: '',
  reorderLevel: '',
  location: '',
  notes: '',
});

const money = (value: number | string | null | undefined) => `$${Number(value ?? 0).toLocaleString()}`;

export const ProcurementPanel = ({ projectId, canApprove, canEdit, initialMaterialRequestId }: ProcurementPanelProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<MaterialRequest[]>([]);
  const [supplierForm, setSupplierForm] = useState({ name: '', email: '', phone: '' });
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [orderInvoices, setOrderInvoices] = useState<Record<string, SupplierInvoice[]>>({});
  const [invoiceAttachments, setInvoiceAttachments] = useState<Record<string, any[]>>({});
  const [orderReceipts, setOrderReceipts] = useState<Record<string, GoodsReceipt[]>>({});
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [orderForm, setOrderForm] = useState<PurchaseOrderForm>(emptyPurchaseOrderForm());
  const [orderSaving, setOrderSaving] = useState(false);
  const [invoiceTarget, setInvoiceTarget] = useState<string | null>(null);
  const [receiptTarget, setReceiptTarget] = useState<string | null>(null);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(emptyInvoiceForm());
  const [receiptForm, setReceiptForm] = useState<ReceiptForm>(emptyReceiptForm());
  const [adjustForm, setAdjustForm] = useState<AdjustForm>(emptyAdjustForm());
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [savingAdjust, setSavingAdjust] = useState(false);
  const [actingInvoiceId, setActingInvoiceId] = useState<string | null>(null);
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState<string | null>(null);
  const [transferringStockId, setTransferringStockId] = useState<string | null>(null);

  const totalInvoices = Object.values(orderInvoices).reduce((sum, invoices) => sum + invoices.length, 0);
  const totalReceipts = Object.values(orderReceipts).reduce((sum, receipts) => sum + receipts.length, 0);
  const issuedToTasks = movements
    .filter((movement) => movement.type === 'out' && movement.referenceType === 'task_assignment')
    .reduce((sum, movement) => sum + Number(movement.quantity), 0);
  const receivedIntoStore = movements
    .filter((movement) => movement.type === 'in')
    .reduce((sum, movement) => sum + Number(movement.quantity), 0);
  const recentMovements = movements.slice(0, 6);
  const getErrorMessage = (err: any, fallback: string) => {
    const msg = err?.response?.data?.message;
    return Array.isArray(msg) ? msg.join(', ') : (msg || fallback);
  };

  const getInvoiceStatusClass = (status: SupplierInvoice['status']) => {
    switch (status) {
      case 'received':
        return 'bg-amber-100 text-amber-700';
      case 'verified':
        return 'bg-blue-100 text-blue-700';
      case 'approved':
        return 'bg-emerald-100 text-emerald-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        suppliersRes,
        requestsRes,
        ordersRes,
        inventoryRes,
        movementsRes,
      ] = await Promise.all([
        suppliersApi.getAll(),
        materialRequestsApi.getByProject(projectId),
        purchaseOrdersApi.getByProject(projectId),
        inventoryApi.getByProject(projectId),
        inventoryApi.getMovements(projectId),
      ]);

      const supplierList = suppliersRes.data?.data || suppliersRes.data || [];
      const requestList = requestsRes.data?.data || requestsRes.data || [];
      const orderList = ordersRes.data?.data || ordersRes.data || [];
      const inventoryList = inventoryRes.data?.data || inventoryRes.data || [];
      const movementList = movementsRes.data?.data || movementsRes.data || [];

      setSuppliers(supplierList);
      setApprovedRequests(
        (requestList as MaterialRequest[]).filter(
          (request) => request.status === 'approved',
        ),
      );
      setOrders(orderList);
      setStockItems(inventoryList);
      setMovements(movementList);
      if (!orderForm.supplierId && supplierList.length > 0) {
        setOrderForm((prev) => ({ ...prev, supplierId: supplierList[0].id }));
      }

      const invoicePairs = await Promise.all(
        orderList.map(async (order: PurchaseOrder) => {
          const response = await supplierInvoicesApi.getByPurchaseOrder(order.id);
          return [order.id, response.data?.data || response.data || []] as const;
        }),
      );
      const receiptPairs = await Promise.all(
        orderList.map(async (order: PurchaseOrder) => {
          const response = await goodsReceiptsApi.getByPurchaseOrder(order.id);
          return [order.id, response.data?.data || response.data || []] as const;
        }),
      );
      const attachmentPairs = await Promise.all(
        invoicePairs.flatMap(([, invoices]) =>
          (invoices as SupplierInvoice[]).map(async (invoice) => {
            const response = await attachmentsApi.getByEntity(
              'supplier_invoice',
              invoice.id,
            );
            return [invoice.id, response.data?.data || response.data || []] as const;
          }),
        ),
      );

      setOrderInvoices(Object.fromEntries(invoicePairs));
      setOrderReceipts(Object.fromEntries(receiptPairs));
      setInvoiceAttachments(Object.fromEntries(attachmentPairs));
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load procurement data'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e: FormEvent) => {
    e.preventDefault();
    setCreatingSupplier(true);
    try {
      await suppliersApi.create({
        name: supplierForm.name.trim(),
        email: supplierForm.email.trim() || undefined,
        phone: supplierForm.phone.trim() || undefined,
      });
      setSupplierForm({ name: '', email: '', phone: '' });
      await loadData();
    } finally {
      setCreatingSupplier(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!initialMaterialRequestId) return;
    syncOrderWithRequest(initialMaterialRequestId);
  }, [initialMaterialRequestId, approvedRequests]);

  const addOrderItem = () => setOrderForm((prev) => ({ ...prev, items: [...prev.items, emptyOrderItem()] }));
  const removeOrderItem = (index: number) => setOrderForm((prev) => ({
    ...prev,
    items: prev.items.length === 1 ? prev.items : prev.items.filter((_, itemIndex) => itemIndex !== index),
  }));
  const updateOrderItem = (index: number, field: keyof OrderFormItem, value: string) => setOrderForm((prev) => ({
    ...prev,
    items: prev.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
  }));

  const syncOrderWithRequest = (requestId: string) => {
    const request = approvedRequests.find((item) => item.id === requestId);
    setOrderForm((prev) => {
      if (!request) {
        return { ...prev, materialRequestId: requestId };
      }

      return {
        ...prev,
        materialRequestId: request.id,
        title:
          prev.title.trim() ||
          request.title ||
          `Purchase for ${request.title || 'approved request'}`,
        notes: prev.notes.trim() || request.purpose || request.notes || '',
        items:
          request.items?.length > 0
            ? request.items.map((item) => ({
                id: crypto.randomUUID(),
                name: item.name,
                description: item.notes || '',
                quantity: String(Number(item.quantity || 0)),
                unit: item.unit,
                unitPrice: String(
                  Number(item.quantity || 0) > 0
                    ? Number(item.estimatedCost || 0) / Number(item.quantity || 1)
                    : Number(item.estimatedCost || 0),
                ),
                notes: item.notes || '',
              }))
            : prev.items,
      };
    });
  };

  const getStockStatusClass = (status: StockStatus) => {
    switch (status) {
      case 'available_in_store':
        return 'bg-emerald-100 text-emerald-700';
      case 'allocated_to_site':
        return 'bg-amber-100 text-amber-700';
      case 'allocated_to_project':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCreateOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!orderForm.supplierId) return;
    setOrderSaving(true);
    try {
      const items = orderForm.items.map((item) => ({
        name: item.name.trim(),
        description: item.description.trim() || undefined,
        quantity: Number(item.quantity),
        unit: item.unit.trim(),
        unitPrice: Number(item.unitPrice),
        notes: item.notes.trim() || undefined,
      }));
      await purchaseOrdersApi.create(projectId, {
        supplierId: orderForm.supplierId,
        materialRequestId: orderForm.materialRequestId.trim() || undefined,
        title: orderForm.title.trim() || undefined,
        notes: orderForm.notes.trim() || undefined,
        taxAmount: orderForm.taxAmount ? Number(orderForm.taxAmount) : undefined,
        items,
      });
      setOrderForm(emptyPurchaseOrderForm());
      await loadData();
    } finally {
      setOrderSaving(false);
    }
  };

  const handleOrderAction = async (orderId: string, action: 'approve' | 'send' | 'cancel') => {
    if (action === 'approve') await purchaseOrdersApi.approve(orderId);
    if (action === 'send') await purchaseOrdersApi.send(orderId);
    if (action === 'cancel') await purchaseOrdersApi.cancel(orderId);
    await loadData();
  };

  const startInvoice = (order: PurchaseOrder) => {
    setInvoiceTarget(order.id);
    setInvoiceForm({
      ...emptyInvoiceForm(),
      subtotal: String(Number(order.subtotal || 0)),
      taxAmount: String(Number(order.taxAmount || 0)),
      totalAmount: String(Number(order.totalAmount || 0)),
    });
  };

  const handleCreateInvoice = async (e: FormEvent) => {
    e.preventDefault();
    if (!invoiceTarget) return;
    setSavingInvoice(true);
    try {
      await supplierInvoicesApi.create(invoiceTarget, {
        invoiceNumber: invoiceForm.invoiceNumber.trim(),
        invoiceDate: invoiceForm.invoiceDate,
        dueDate: invoiceForm.dueDate || undefined,
        subtotal: Number(invoiceForm.subtotal),
        taxAmount: invoiceForm.taxAmount ? Number(invoiceForm.taxAmount) : 0,
        totalAmount: invoiceForm.totalAmount ? Number(invoiceForm.totalAmount) : undefined,
        notes: invoiceForm.notes.trim() || undefined,
        fileUrl: invoiceForm.fileUrl.trim() || undefined,
      });
      setInvoiceTarget(null);
      setInvoiceForm(emptyInvoiceForm());
      await loadData();
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleInvoiceAction = async (invoiceId: string, action: 'verify' | 'approve' | 'pay' | 'reject') => {
    setActingInvoiceId(invoiceId);
    setError('');
    try {
      if (action === 'verify') await supplierInvoicesApi.verify(invoiceId);
      if (action === 'approve') await supplierInvoicesApi.approve(invoiceId);
      if (action === 'pay') await supplierInvoicesApi.pay(invoiceId);
      if (action === 'reject') await supplierInvoicesApi.reject(invoiceId);
      await loadData();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to update invoice'));
    } finally {
      setActingInvoiceId(null);
    }
  };

  const handleUploadInvoiceProof = async (invoiceId: string, file: File) => {
    setUploadingInvoiceId(invoiceId);
    setError('');
    try {
      const description =
        window.prompt(
          'What is this payment proof for?',
          'Bank transfer / payment receipt for supplier invoice',
        ) || '';
      await attachmentsApi.upload(file, 'supplier_invoice', invoiceId, description);
      await loadData();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to upload payment proof'));
    } finally {
      setUploadingInvoiceId(null);
    }
  };

  const openAttachment = async (attachmentId: string) => {
    try {
      const response = await attachmentsApi.getDownloadUrl(attachmentId);
      const url = response.data?.data?.url || response.data?.url;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to open attachment'));
    }
  };

  const startReceipt = (order: PurchaseOrder) => {
    setReceiptTarget(order.id);
    setReceiptForm({
      notes: '',
      destinationType: 'store',
      destinationLabel: 'Main Store',
      items: (order.items || []).map((item) => ({
        purchaseOrderItemId: item.id,
        name: item.name,
        unit: item.unit,
        orderedQuantity: String(item.quantity),
        receivedQuantity: String(item.quantity),
        damagedQuantity: '0',
        notes: item.notes ?? '',
      })),
    });
  };

  const updateReceiptItem = (index: number, field: keyof ReceiptFormItem, value: string) => {
    setReceiptForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  };

  const handleCreateReceipt = async (e: FormEvent) => {
    e.preventDefault();
    if (!receiptTarget) return;
    setSavingReceipt(true);
    try {
      await goodsReceiptsApi.create(receiptTarget, {
        notes: receiptForm.notes.trim() || undefined,
        destinationType: receiptForm.destinationType,
        destinationLabel: receiptForm.destinationLabel.trim() || undefined,
        items: receiptForm.items.map((item) => ({
          purchaseOrderItemId: item.purchaseOrderItemId,
          name: item.name.trim(),
          unit: item.unit.trim(),
          orderedQuantity: Number(item.orderedQuantity),
          receivedQuantity: Number(item.receivedQuantity),
          damagedQuantity: Number(item.damagedQuantity || 0),
          notes: item.notes.trim() || undefined,
        })),
      });
      setReceiptTarget(null);
      setReceiptForm(emptyReceiptForm());
      await loadData();
    } finally {
      setSavingReceipt(false);
    }
  };

  const handleTransferStock = async (
    stockItemId: string,
    stockStatus: StockStatus,
    currentLocation?: string | null,
  ) => {
    setTransferringStockId(stockItemId);
    setError('');
    try {
      const nextLocation =
        window.prompt(
          stockStatus === 'available_in_store'
            ? 'Store name or shelf'
            : 'Site or allocation location',
          currentLocation || '',
        ) || '';
      const allocationTarget =
        stockStatus === 'available_in_store'
          ? undefined
          : window.prompt('Allocated to which site/project?', nextLocation || '') ||
            '';
      await inventoryApi.transfer(projectId, stockItemId, {
        stockStatus,
        location: nextLocation || undefined,
        allocationTarget: allocationTarget?.trim() || undefined,
      });
      await loadData();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to transfer stock'));
    } finally {
      setTransferringStockId(null);
    }
  };

  const handleAdjustStock = async (e: FormEvent) => {
    e.preventDefault();
    setSavingAdjust(true);
    try {
      await inventoryApi.adjust(projectId, {
        name: adjustForm.name.trim(),
        unit: adjustForm.unit.trim(),
        quantity: Number(adjustForm.quantity),
        reorderLevel: adjustForm.reorderLevel ? Number(adjustForm.reorderLevel) : undefined,
        location: adjustForm.location.trim() || undefined,
        notes: adjustForm.notes.trim() || undefined,
      });
      setAdjustForm(emptyAdjustForm());
      await loadData();
    } finally {
      setSavingAdjust(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading procurement data...</div>;
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Suppliers', value: suppliers.length, tone: 'bg-slate-50 text-slate-700' },
          { label: 'Purchase Orders', value: orders.length, tone: 'bg-blue-50 text-blue-700' },
          { label: 'Supplier Invoices', value: totalInvoices, tone: 'bg-purple-50 text-purple-700' },
          { label: 'Goods Receipts', value: totalReceipts, tone: 'bg-amber-50 text-amber-700' },
          { label: 'Warehouse Stock', value: stockItems.length, tone: 'bg-emerald-50 text-emerald-700' },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl border border-gray-200 px-4 py-3 ${item.tone}`}>
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-xs font-medium mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500">Received Into Store</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{Number(receivedIntoStore).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500">Issued To Tasks</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{Number(issuedToTasks).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500">Movement Records</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{movements.length}</p>
        </div>
      </div>

      {canEdit && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Suppliers</h3>
              <p className="text-sm text-gray-500 mt-1">Create supplier records used by purchase orders and invoices.</p>
            </div>
            <div className="text-sm text-gray-500">{suppliers.length} suppliers</div>
          </div>

          <form onSubmit={handleCreateSupplier} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Supplier name"
            />
            <input
              value={supplierForm.email}
              onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email"
            />
            <input
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Phone"
            />
            <button
              type="submit"
              disabled={creatingSupplier}
              className="px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {creatingSupplier ? 'Saving...' : 'Add Supplier'}
            </button>
          </form>

          {suppliers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suppliers.map((supplier) => (
                <span key={supplier.id} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                  {supplier.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {canEdit ? (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Purchase Order</h3>
                <p className="text-sm text-gray-500 mt-1">Create an order to send to a supplier.</p>
              </div>

              <form className="space-y-4" onSubmit={handleCreateOrder}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select
                      value={orderForm.supplierId}
                      onChange={(e) => setOrderForm({ ...orderForm, supplierId: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order Title</label>
                    <input
                      value={orderForm.title}
                      onChange={(e) => setOrderForm({ ...orderForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional purchase order title"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Linked Material Request</label>
                    <select
                      value={orderForm.materialRequestId}
                      onChange={(e) => syncOrderWithRequest(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No linked request</option>
                      {approvedRequests.map((request) => (
                        <option key={request.id} value={request.id}>
                          {request.title} · {money(request.requestedAmount)}
                        </option>
                      ))}
                    </select>
                    {approvedRequests.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        Selecting an approved request fills the order items for the engineer.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={orderForm.taxAmount}
                      onChange={(e) => setOrderForm({ ...orderForm, taxAmount: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes</label>
                  <textarea
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Order Items</label>
                    <button type="button" onClick={addOrderItem} className="text-xs font-medium text-blue-600 hover:text-blue-700">+ Add item</button>
                  </div>
                  {orderForm.items.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <input
                          required
                          value={item.name}
                          onChange={(e) => updateOrderItem(index, 'name', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Item name"
                        />
                        <input
                          value={item.description}
                          onChange={(e) => updateOrderItem(index, 'description', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Description"
                        />
                        <input
                          required
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Qty"
                        />
                        <input
                          required
                          value={item.unit}
                          onChange={(e) => updateOrderItem(index, 'unit', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Unit"
                        />
                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateOrderItem(index, 'unitPrice', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Unit price"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <input
                          value={item.notes}
                          onChange={(e) => updateOrderItem(index, 'notes', e.target.value)}
                          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Item notes"
                        />
                        {orderForm.items.length > 1 && (
                          <button type="button" onClick={() => removeOrderItem(index)} className="text-xs text-red-600 hover:text-red-700">Remove</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={orderSaving || !orderForm.supplierId}
                    className="px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {orderSaving ? 'Creating...' : 'Create Order'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Adjust Store Stock</h3>
                <p className="text-sm text-gray-500 mt-1">Manual adjustment for store or warehouse stock.</p>
              </div>

              <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleAdjustStock}>
                <input
                  required
                  value={adjustForm.name}
                  onChange={(e) => setAdjustForm({ ...adjustForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Material name"
                />
                <input
                  required
                  value={adjustForm.unit}
                  onChange={(e) => setAdjustForm({ ...adjustForm, unit: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Unit"
                />
                <input
                  required
                  type="number"
                  step="0.01"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Quantity"
                />
                <input
                  type="number"
                  step="0.01"
                  value={adjustForm.reorderLevel}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reorderLevel: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reorder level"
                />
                <input
                  value={adjustForm.location}
                  onChange={(e) => setAdjustForm({ ...adjustForm, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                  placeholder="Location"
                />
                <textarea
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none md:col-span-2"
                  placeholder="Notes"
                />
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingAdjust}
                    className="px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    {savingAdjust ? 'Saving...' : 'Adjust Stock'}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-500 xl:col-span-2">
            You do not have permission to create or adjust procurement records on this project.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Purchase Orders</h3>
              <p className="text-sm text-gray-500 mt-1">Approve, send, invoice, and receive materials.</p>
            </div>
            <div className="text-sm text-gray-500">{orders.length} orders</div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No purchase orders yet.</div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const invoices = orderInvoices[order.id] || [];
                const receipts = orderReceipts[order.id] || [];
                return (
                  <div key={order.id} className="border border-gray-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">{order.status.replace('_', ' ')}</span>
                          {order.materialRequestId && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                              Material request linked
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{order.title || order.supplier?.name || 'Purchase order'}</p>
                        <p className="text-xs text-gray-400 mt-1">Total {money(order.totalAmount)} · Supplier: {order.supplier?.name ?? order.supplierId}</p>
                        {order.materialRequestId && (
                          <p className="text-xs text-gray-400 mt-1">Request ID: {order.materialRequestId}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{money(order.totalAmount)}</p>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(order.items || []).map((item: PurchaseOrderItem) => (
                        <div key={item.id ?? `${item.name}-${item.unit}`} className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{money(item.lineTotal)}</p>
                        </div>
                      ))}
                    </div>

                    {order.notes && <p className="text-sm text-gray-500">{order.notes}</p>}

                    <div className="flex flex-wrap gap-2 justify-end">
                      {canApprove && order.status !== 'approved' && order.status !== 'sent' && order.status !== 'received' && order.status !== 'closed' && (
                        <button onClick={() => handleOrderAction(order.id, 'approve')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700">Approve</button>
                      )}
                      {canApprove && order.status === 'approved' && (
                        <button onClick={() => handleOrderAction(order.id, 'send')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">Send</button>
                      )}
                      {canApprove && order.status !== 'received' && order.status !== 'closed' && order.status !== 'cancelled' && (
                        <button onClick={() => handleOrderAction(order.id, 'cancel')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200">Cancel</button>
                      )}
                      <button onClick={() => startInvoice(order)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200">Invoice</button>
                      <button onClick={() => startReceipt(order)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200">Receive</button>
                    </div>

                    {!!invoices.length && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Invoices</p>
                        {invoices.map((invoice) => (
                          <div key={invoice.id} className="rounded-lg border border-gray-100 bg-white px-4 py-3 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</p>
                                  <span className={`text-[11px] px-2 py-1 rounded-full font-medium capitalize ${getInvoiceStatusClass(invoice.status)}`}>
                                    {invoice.status}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                                  {invoice.dueDate ? ` · Due ${new Date(invoice.dueDate).toLocaleDateString()}` : ''}
                                </p>
                                {invoice.fileUrl && (
                                  <a
                                    href={invoice.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                                  >
                                    Open attachment
                                  </a>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-gray-900">{money(invoice.totalAmount)}</p>
                            </div>

                            {!!invoiceAttachments[invoice.id]?.length && (
                              <div className="flex flex-wrap gap-2">
                                {invoiceAttachments[invoice.id].map((attachment: any) => (
                                  <button
                                    key={attachment.id}
                                    type="button"
                                    onClick={() => openAttachment(attachment.id)}
                                    className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  >
                                    {attachment.description || attachment.filename}
                                  </button>
                                ))}
                              </div>
                            )}

                            {canApprove && (
                              <div className="flex flex-wrap gap-2 justify-end">
                                <label className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">
                                  {uploadingInvoiceId === invoice.id
                                    ? 'Uploading...'
                                    : 'Upload Payment Proof'}
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    disabled={uploadingInvoiceId === invoice.id}
                                    onChange={async (event) => {
                                      const file = event.target.files?.[0];
                                      if (file) {
                                        await handleUploadInvoiceProof(invoice.id, file);
                                        event.target.value = '';
                                      }
                                    }}
                                  />
                                </label>
                                {invoice.status === 'received' && (
                                  <>
                                    <button
                                      onClick={() => handleInvoiceAction(invoice.id, 'verify')}
                                      disabled={actingInvoiceId === invoice.id}
                                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                                    >
                                      {actingInvoiceId === invoice.id ? 'Working...' : 'Verify'}
                                    </button>
                                    <button
                                      onClick={() => handleInvoiceAction(invoice.id, 'approve')}
                                      disabled={actingInvoiceId === invoice.id}
                                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                      {actingInvoiceId === invoice.id ? 'Working...' : 'Approve'}
                                    </button>
                                  </>
                                )}
                                {invoice.status === 'verified' && (
                                  <button
                                    onClick={() => handleInvoiceAction(invoice.id, 'approve')}
                                    disabled={actingInvoiceId === invoice.id}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {actingInvoiceId === invoice.id ? 'Working...' : 'Approve'}
                                  </button>
                                )}
                                {invoice.status === 'approved' && (
                                  <button
                                    onClick={() => handleInvoiceAction(invoice.id, 'pay')}
                                    disabled={actingInvoiceId === invoice.id}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    {actingInvoiceId === invoice.id ? 'Working...' : 'Mark Paid'}
                                  </button>
                                )}
                                {invoice.status !== 'paid' && invoice.status !== 'rejected' && (
                                  <button
                                    onClick={() => handleInvoiceAction(invoice.id, 'reject')}
                                    disabled={actingInvoiceId === invoice.id}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                                  >
                                    {actingInvoiceId === invoice.id ? 'Working...' : 'Reject'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {!!receipts.length && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Receipts</p>
                        {receipts.map((receipt) => (
                          <div key={receipt.id} className="rounded-lg border border-gray-100 bg-white px-4 py-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{receipt.status.replace('_', ' ')}</p>
                              <p className="text-xs text-gray-500">{new Date(receipt.receivedAt).toLocaleString()}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {receipt.destinationType === 'site' ? 'Sent to site' : 'Stored in store'}
                                {receipt.destinationLabel ? ` · ${receipt.destinationLabel}` : ''}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{receipt.items?.length ?? 0} items</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {invoiceTarget === order.id && (
                      <form onSubmit={handleCreateInvoice} className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-purple-900">Create Invoice</p>
                          <button type="button" onClick={() => setInvoiceTarget(null)} className="text-xs text-gray-500 hover:text-gray-700">Close</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input value={invoiceForm.invoiceNumber} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })} placeholder="Invoice number" className="w-full px-4 py-2.5 border border-purple-200 rounded-lg text-sm" />
                          <input type="date" value={invoiceForm.invoiceDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })} className="w-full px-4 py-2.5 border border-purple-200 rounded-lg text-sm" />
                          <input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} className="w-full px-4 py-2.5 border border-purple-200 rounded-lg text-sm" />
                          <input type="number" min="0" step="0.01" value={invoiceForm.subtotal} onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: e.target.value })} placeholder="Subtotal" className="w-full px-4 py-2.5 border border-purple-200 rounded-lg text-sm" />
                          <input type="number" min="0" step="0.01" value={invoiceForm.taxAmount} onChange={(e) => setInvoiceForm({ ...invoiceForm, taxAmount: e.target.value })} placeholder="Tax amount" className="w-full px-4 py-2.5 border border-purple-200 rounded-lg text-sm" />
                          <input type="number" min="0" step="0.01" value={invoiceForm.totalAmount} onChange={(e) => setInvoiceForm({ ...invoiceForm, totalAmount: e.target.value })} placeholder="Total amount" className="w-full px-4 py-2.5 border border-purple-200 rounded-lg text-sm" />
                          <input value={invoiceForm.fileUrl} onChange={(e) => setInvoiceForm({ ...invoiceForm, fileUrl: e.target.value })} placeholder="Attachment URL" className="w-full px-4 py-2.5 border border-purple-200 rounded-lg text-sm md:col-span-2" />
                          <textarea value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} placeholder="Notes" rows={2} className="w-full px-4 py-2.5 border border-purple-200 rounded-lg text-sm resize-none md:col-span-2" />
                        </div>
                        <div className="flex justify-end">
                          <button type="submit" disabled={savingInvoice} className="px-4 py-2.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50">{savingInvoice ? 'Saving...' : 'Create Invoice'}</button>
                        </div>
                      </form>
                    )}

                    {receiptTarget === order.id && (
                      <form onSubmit={handleCreateReceipt} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-amber-900">Receive Materials</p>
                          <button type="button" onClick={() => setReceiptTarget(null)} className="text-xs text-gray-500 hover:text-gray-700">Close</button>
                        </div>
                        <textarea value={receiptForm.notes} onChange={(e) => setReceiptForm({ ...receiptForm, notes: e.target.value })} placeholder="Receipt notes" rows={2} className="w-full px-4 py-2.5 border border-amber-200 rounded-lg text-sm resize-none" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <select
                            value={receiptForm.destinationType}
                            onChange={(e) => setReceiptForm({
                              ...receiptForm,
                              destinationType: e.target.value as GoodsReceiptDestinationType,
                              destinationLabel: e.target.value === 'site' ? 'Project Site' : 'Main Store',
                            })}
                            className="w-full px-4 py-2.5 border border-amber-200 rounded-lg text-sm"
                          >
                            <option value="store">Receive into store</option>
                            <option value="site">Send directly to site</option>
                          </select>
                          <input
                            value={receiptForm.destinationLabel}
                            onChange={(e) => setReceiptForm({ ...receiptForm, destinationLabel: e.target.value })}
                            placeholder={receiptForm.destinationType === 'site' ? 'Site name or zone' : 'Store name / shelf'}
                            className="w-full px-4 py-2.5 border border-amber-200 rounded-lg text-sm"
                          />
                        </div>
                        <div className="space-y-3">
                          {receiptForm.items.map((item, index) => (
                            <div key={`${index}-${item.name}`} className="border border-amber-100 bg-white rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{item.name}</p>
                                <span className="text-xs text-gray-400">{item.orderedQuantity} {item.unit}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <input type="number" step="0.01" min="0" value={item.receivedQuantity} onChange={(e) => updateReceiptItem(index, 'receivedQuantity', e.target.value)} className="w-full px-4 py-2.5 border border-amber-200 rounded-lg text-sm" placeholder="Received" />
                                <input type="number" step="0.01" min="0" value={item.damagedQuantity} onChange={(e) => updateReceiptItem(index, 'damagedQuantity', e.target.value)} className="w-full px-4 py-2.5 border border-amber-200 rounded-lg text-sm" placeholder="Damaged" />
                                <input value={item.orderedQuantity} disabled className="w-full px-4 py-2.5 border border-amber-100 rounded-lg text-sm bg-gray-50" />
                                <input value={item.notes} onChange={(e) => updateReceiptItem(index, 'notes', e.target.value)} className="w-full px-4 py-2.5 border border-amber-200 rounded-lg text-sm" placeholder="Notes" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end">
                          <button type="submit" disabled={savingReceipt} className="px-4 py-2.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50">{savingReceipt ? 'Saving...' : 'Save Receipt'}</button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Warehouse / Store</h3>
              <p className="text-sm text-gray-500 mt-1">Stock increased by goods receipts and manual adjustments.</p>
            </div>
            <div className="text-sm text-gray-500">{stockItems.length} items</div>
          </div>

          {stockItems.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No stock items yet.</div>
          ) : (
            <div className="space-y-3">
              {stockItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{Number(item.currentQuantity).toLocaleString()} {item.unit}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${getStockStatusClass(item.stockStatus)}`}>
                        {item.stockStatus.replace(/_/g, ' ')}
                      </span>
                      {item.allocationTarget && (
                        <span className="text-[11px] px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                          {item.allocationTarget}
                        </span>
                      )}
                    </div>
                    {item.location && <p className="text-xs text-gray-400 mt-0.5">Location: {item.location}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">Reorder {Number(item.reorderLevel).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{money(item.currentQuantity)}</p>
                    {canEdit && (
                      <div className="flex gap-2 justify-end mt-2">
                        <button
                          type="button"
                          onClick={() => handleTransferStock(item.id, 'available_in_store', item.location)}
                          disabled={transferringStockId === item.id}
                          className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                        >
                          To Store
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTransferStock(item.id, 'allocated_to_site', item.location)}
                          disabled={transferringStockId === item.id}
                          className="px-2.5 py-1 text-[11px] rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50"
                        >
                          To Site
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Warehouse Movements</h3>
              <p className="text-sm text-gray-500 mt-1">Recent receipts, adjustments, and task allocations.</p>
            </div>
            <div className="text-sm text-gray-500">{movements.length} movements</div>
          </div>

          {recentMovements.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No warehouse movements yet.</div>
          ) : (
            <div className="space-y-2">
              {recentMovements.map((movement) => (
                <div key={movement.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{movement.stockItem?.name || 'Stock movement'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {movement.type.toUpperCase()} · {Number(movement.quantity).toLocaleString()} {movement.stockItem?.unit || ''}
                      {movement.referenceType ? ` · ${movement.referenceType.replace(/_/g, ' ')}` : ''}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap">{new Date(movement.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
