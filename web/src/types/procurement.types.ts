export type SupplierStatus = 'active' | 'inactive';
export type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'closed' | 'cancelled';
export type SupplierInvoiceStatus = 'received' | 'verified' | 'approved' | 'paid' | 'rejected';
export type GoodsReceiptStatus = 'pending' | 'partial' | 'completed';
export type GoodsReceiptDestinationType = 'store' | 'site';
export type StockMovementType = 'in' | 'out' | 'adjustment' | 'transfer';
export type StockStatus =
  | 'available_in_store'
  | 'allocated_to_site'
  | 'allocated_to_project';

export type Supplier = {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  notes?: string | null;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrderItem = {
  id?: string;
  purchaseOrderId?: string;
  name: string;
  description?: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  notes?: string | null;
};

export type PurchaseOrder = {
  id: string;
  projectId: string;
  supplierId: string;
  materialRequestId?: string | null;
  orderNumber: string;
  title?: string | null;
  status: PurchaseOrderStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string | null;
  requestedById: string;
  approvedById?: string | null;
  sentAt?: string | null;
  supplier?: Supplier;
  requestedBy?: { id: string; name: string; email: string; role: string };
  approvedBy?: { id: string; name: string; email: string; role: string } | null;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type SupplierInvoice = {
  id: string;
  purchaseOrderId: string;
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: SupplierInvoiceStatus;
  notes?: string | null;
  fileUrl?: string | null;
  verifiedById?: string | null;
  approvedById?: string | null;
  paidAt?: string | null;
  supplier?: Supplier;
  purchaseOrder?: PurchaseOrder;
  createdAt: string;
  updatedAt: string;
};

export type GoodsReceiptItem = {
  id?: string;
  goodsReceiptId?: string;
  purchaseOrderItemId?: string | null;
  name: string;
  unit: string;
  orderedQuantity: number;
  receivedQuantity: number;
  damagedQuantity: number;
  acceptedQuantity: number;
  notes?: string | null;
};

export type GoodsReceipt = {
  id: string;
  purchaseOrderId: string;
  status: GoodsReceiptStatus;
  receivedById: string;
  receivedAt: string;
  notes?: string | null;
  destinationType: GoodsReceiptDestinationType;
  destinationLabel?: string | null;
  purchaseOrder?: PurchaseOrder;
  receivedBy?: { id: string; name: string; email: string; role: string };
  items: GoodsReceiptItem[];
  createdAt: string;
  updatedAt: string;
};

export type StockItem = {
  id: string;
  projectId: string;
  name: string;
  unit: string;
  currentQuantity: number;
  reorderLevel: number;
  stockStatus: StockStatus;
  allocationTarget?: string | null;
  location?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StockMovement = {
  id: string;
  stockItemId: string;
  stockItem?: StockItem;
  type: StockMovementType;
  quantity: number;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; name: string; email: string; role: string } | null;
  createdAt: string;
};
