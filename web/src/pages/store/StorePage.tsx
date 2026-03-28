import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { inventoryApi } from '../../api/procurement.api';
import { webSocketService, type InventoryEvent, type LowStockAlertEvent } from '../../services/websocket.service';
import MaterialHistoryModal from '../../components/store/MaterialHistoryModal';
import type { StockItem } from '../../types/procurement.types';
import { useAuthStore } from '../../store/auth.store';

type StoreItem = StockItem & { projectName: string };
type ProjectInfo = { id: string; name: string };
type HistoryMaterial = {
  name: string;
  unit: string;
  location: string;
  projects: ProjectInfo[];
};
type GroupedMaterial = HistoryMaterial & {
  quantity: number;
  reorderLevel: number;
  stockStatus: 'low_stock' | 'normal' | 'overstock';
};

const StoreAnalytics = lazy(() => import('../../components/store/StoreAnalytics'));

type StockStatus = 'all' | 'low_stock' | 'normal' | 'overstock';
type SortBy = 'name' | 'quantity' | 'reorder_level' | 'projects';

const StorePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<StoreItem[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [query, setQuery] = useState('');
  const [realTimeUpdate, setRealTimeUpdate] = useState<string>('');
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlertEvent[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    material: HistoryMaterial | null;
  }>({ isOpen: false, material: null });
  
  // Advanced filters
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [stockStatus, setStockStatus] = useState<StockStatus>('all');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await inventoryApi.getGlobal();
        const data = res.data?.data || res.data || {};
        setProjects(data.projects || []);
        setItems(data.items || []);
      } catch (err: any) {
        const msg = err?.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to load store inventory'));
      } finally {
        setLoading(false);
      }
    };

    load();

    // Setup WebSocket connection
    if (accessToken) {
      webSocketService.connect(accessToken)
        .then(() => {
          // Subscribe to global inventory updates
          webSocketService.subscribeToInventory();
          
          // Listen for inventory updates
          webSocketService.onInventoryUpdate((data: InventoryEvent) => {
            setRealTimeUpdate(`Inventory updated: ${data.item.name} - ${data.type}`);
            setTimeout(() => setRealTimeUpdate(''), 5000);
            
            // Refresh data
            load();
          });

          // Listen for low stock alerts
          webSocketService.onLowStockAlert((alert: LowStockAlertEvent) => {
            setLowStockAlerts(prev => [alert, ...prev.slice(0, 4)]); // Keep only 5 recent alerts
            setTimeout(() => {
              setLowStockAlerts(prev => prev.slice(1)); // Remove alert after 10 seconds
            }, 10000);
          });

          // Listen for critical low stock (for admins/managers)
          webSocketService.onCriticalLowStock((alert: LowStockAlertEvent) => {
            setLowStockAlerts(prev => [{ ...alert, critical: true }, ...prev.slice(0, 4)]);
            setTimeout(() => {
              setLowStockAlerts(prev => prev.slice(1));
            }, 15000); // Keep critical alerts longer
          });
        })
        .catch(error => {
          console.error('Failed to connect to WebSocket:', error);
        });
    }

    // Cleanup
    return () => {
      webSocketService.unsubscribeFromInventory();
      webSocketService.offInventoryUpdate();
      webSocketService.offLowStockAlert();
      webSocketService.offCriticalLowStock();
      webSocketService.disconnect();
    };
  }, [accessToken]);

  // Extract unique locations
  const availableLocations = useMemo(() => {
    const locations = new Set<string>();
    items.forEach(item => {
      if (item.location) locations.add(item.location);
    });
    return Array.from(locations).sort();
  }, [items]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = items.filter((item) => {
      // Text search
      const term = query.trim().toLowerCase();
      if (term && ![item.name, item.unit, item.location, item.projectName]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))) {
        return false;
      }

      // Project filter
      if (selectedProjects.length > 0 && !selectedProjects.includes(item.projectId)) {
        return false;
      }

      // Location filter
      if (selectedLocations.length > 0 && (!item.location || !selectedLocations.includes(item.location))) {
        return false;
      }

      // Stock status filter
      const quantity = Number(item.currentQuantity || 0);
      const reorderLevel = Number(item.reorderLevel || 0);
      
      if (stockStatus === 'low_stock' && quantity > reorderLevel) {
        return false;
      }
      if (stockStatus === 'normal' && (quantity <= reorderLevel || quantity > reorderLevel * 2)) {
        return false;
      }
      if (stockStatus === 'overstock' && quantity <= reorderLevel * 2) {
        return false;
      }

      return true;
    });

    // Sort items
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'quantity':
          comparison = Number(a.currentQuantity || 0) - Number(b.currentQuantity || 0);
          break;
        case 'reorder_level':
          comparison = Number(a.reorderLevel || 0) - Number(b.reorderLevel || 0);
          break;
        case 'projects':
          comparison = a.projectName.localeCompare(b.projectName);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [items, query, selectedProjects, stockStatus, selectedLocations, sortBy, sortOrder]);

  // Group items by material name, unit, and location
  const groupedItems = useMemo(() => {
    const map = new Map<string, GroupedMaterial>();

    for (const item of filteredItems) {
      const key = [item.name.trim().toLowerCase(), item.unit.trim().toLowerCase(), (item.location || '').trim().toLowerCase()].join('|');
      const existing = map.get(key);
      const quantity = Number(item.currentQuantity || 0);
      const reorderLevel = Number(item.reorderLevel || 0);

      let status: 'low_stock' | 'normal' | 'overstock' = 'normal';
      if (quantity <= reorderLevel) status = 'low_stock';
      else if (quantity > reorderLevel * 2) status = 'overstock';

      if (!existing) {
        map.set(key, {
          name: item.name,
          unit: item.unit,
          location: item.location || '—',
          quantity,
          projects: [{ id: item.projectId, name: item.projectName }],
          reorderLevel,
          stockStatus: status,
        });
      } else {
        existing.quantity += quantity;
        existing.reorderLevel = Math.max(existing.reorderLevel, reorderLevel);
        if (!existing.projects.some((project) => project.id === item.projectId)) {
          existing.projects.push({ id: item.projectId, name: item.projectName });
        }
        
        // Update stock status based on combined quantity
        if (existing.quantity <= existing.reorderLevel) existing.stockStatus = 'low_stock';
        else if (existing.quantity > existing.reorderLevel * 2) existing.stockStatus = 'overstock';
        else existing.stockStatus = 'normal';
      }
    }

    return [...map.values()];
  }, [filteredItems]);

  // Calculate statistics
  const lowStockCount = filteredItems.filter((item) => Number(item.currentQuantity || 0) <= Number(item.reorderLevel || 0)).length;
  const overstockCount = filteredItems.filter((item) => Number(item.currentQuantity || 0) > Number(item.reorderLevel || 0) * 2).length;
  const normalStockCount = filteredItems.length - lowStockCount - overstockCount;

  // Chart data preparation
  const stockStatusData = useMemo(() => [
    { name: 'Low Stock', value: lowStockCount, color: '#ef4444' },
    { name: 'Normal', value: normalStockCount, color: '#10b981' },
    { name: 'Overstock', value: overstockCount, color: '#3b82f6' },
  ], [lowStockCount, normalStockCount, overstockCount]);

  const projectDistributionData = useMemo(() => {
    const projectCounts = new Map<string, number>();
    filteredItems.forEach(item => {
      const count = projectCounts.get(item.projectName) || 0;
      projectCounts.set(item.projectName, count + 1);
    });
    return Array.from(projectCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 projects
  }, [filteredItems]);

  const topMaterialsData = useMemo(() => {
    const materialQuantities = new Map<string, number>();
    filteredItems.forEach(item => {
      const current = materialQuantities.get(item.name) || 0;
      materialQuantities.set(item.name, current + Number(item.currentQuantity || 0));
    });
    return Array.from(materialQuantities.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8); // Top 8 materials by quantity
  }, [filteredItems]);

  // Toggle project selection
  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  // Toggle location selection
  const toggleLocation = (location: string) => {
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(loc => loc !== location)
        : [...prev, location]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setQuery('');
    setSelectedProjects([]);
    setStockStatus('all');
    setSelectedLocations([]);
    setSortBy('name');
    setSortOrder('asc');
  };

  // Export functions
  const runExport = async (itemsToExport: GroupedMaterial[], filename: string, format: 'csv' | 'excel') => {
    const { exportToCSV, exportToExcel, prepareExportData } = await import('../../utils/export.utils');
    const exportData = prepareExportData(itemsToExport);
    if (format === 'csv') {
      exportToCSV(exportData, filename);
    } else {
      exportToExcel(exportData, filename);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    await runExport(groupedItems, `inventory_export_${timestamp}`, format);
  };

  // Bulk selection functions
  const toggleItemSelection = (itemKey: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  const selectAllItems = () => {
    const allKeys = groupedItems.map(item => `${item.name}-${item.unit}-${item.location}`);
    setSelectedItems(new Set(allKeys));
    setShowBulkActions(true);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setShowBulkActions(false);
  };

  const getSelectedItemsData = () => {
    return groupedItems.filter(item => 
      selectedItems.has(`${item.name}-${item.unit}-${item.location}`)
    );
  };

  const handleBulkExport = async (format: 'csv' | 'excel') => {
    const selectedData = getSelectedItemsData();
    const timestamp = new Date().toISOString().split('T')[0];
    await runExport(selectedData, `selected_inventory_${timestamp}`, format);
  };

  const openMaterialHistory = (item: GroupedMaterial) => {
    setHistoryModal({
      isOpen: true,
      material: {
        name: item.name,
        unit: item.unit,
        location: item.location,
        projects: item.projects,
      },
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Real-time Updates */}
      {realTimeUpdate && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            {realTimeUpdate}
          </span>
          <button
            onClick={() => setRealTimeUpdate('')}
            className="text-green-600 hover:text-green-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <div className="space-y-2">
          {lowStockAlerts.map((alert, index) => (
            <div
              key={index}
              className={`px-4 py-3 rounded-lg text-sm flex items-center justify-between ${
                (alert as any).critical
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
              }`}
            >
              <span className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                  (alert as any).critical ? 'bg-red-500' : 'bg-yellow-500'
                }`}></span>
                {(alert as any).critical ? 'CRITICAL: ' : ''}
                Low stock alert: {alert.item.name} - {alert.currentQuantity} {alert.item.unit} (Reorder: {alert.reorderLevel})
              </span>
              <span className="text-xs opacity-75">
                {alert.item.projectName}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedItems.size} items selected
            </span>
            <button
              onClick={selectAllItems}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Select All ({groupedItems.length})
            </button>
            <button
              onClick={clearSelection}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkExport('csv')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
            >
              Export Selected CSV
            </button>
            <button
              onClick={() => handleBulkExport('excel')}
              className="px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
            >
              Export Selected Excel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Store</h1>
            <p className="text-sm text-gray-500 mt-1">Global inventory management across all projects</p>
          </div>
          {webSocketService.isConnected() && (
            <div className="flex items-center text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
              Live
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="w-full lg:w-96">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by material, project, unit, or location"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={groupedItems.length === 0}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={groupedItems.length === 0}
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500">Projects</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{projects.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500">Total Items</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{filteredItems.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500">Low Stock</p>
          <p className="text-xl font-bold text-red-600 mt-1">{lowStockCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500">Normal</p>
          <p className="text-xl font-bold text-green-600 mt-1">{normalStockCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500">Overstock</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{overstockCount}</p>
        </div>
      </div>

      {/* Charts Section */}
      <Suspense fallback={<div className="bg-white border border-gray-200 rounded-2xl p-5 text-sm text-gray-500">Loading analytics...</div>}>
        <StoreAnalytics
          stockStatusData={stockStatusData}
          projectDistributionData={projectDistributionData}
          topMaterialsData={topMaterialsData}
        />
      </Suspense>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stock Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Stock Status</label>
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value as StockStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="low_stock">Low Stock</option>
              <option value="normal">Normal</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Material Name</option>
              <option value="quantity">Quantity</option>
              <option value="reorder_level">Reorder Level</option>
              <option value="projects">Project</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Sort Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {/* Project Filters */}
        {projects.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Projects</label>
            <div className="flex flex-wrap gap-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => toggleProject(project.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedProjects.includes(project.id)
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {project.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location Filters */}
        {availableLocations.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Locations</label>
            <div className="flex flex-wrap gap-2">
              {availableLocations.map((location) => (
                <button
                  key={location}
                  onClick={() => toggleLocation(location)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedLocations.includes(location)
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Results */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : groupedItems.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white border border-gray-200 rounded-2xl">
          No materials found matching your criteria.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 w-12">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === groupedItems.length && groupedItems.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAllItems();
                      } else {
                        clearSelection();
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Material</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Quantity</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Reorder</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Projects</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Location</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedItems.map((item) => {
                const itemKey = `${item.name}-${item.unit}-${item.location}`;
                const isSelected = selectedItems.has(itemKey);
                return (
                  <tr key={itemKey} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItemSelection(itemKey)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.unit}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                      {Number(item.quantity).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-700">{Number(item.reorderLevel).toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.stockStatus === 'low_stock' 
                          ? 'bg-red-100 text-red-700'
                          : item.stockStatus === 'overstock'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.stockStatus === 'low_stock' ? 'Low Stock' : item.stockStatus === 'overstock' ? 'Overstock' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-2">
                        {item.projects.map((project) => (
                          <span key={project.id} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                            {project.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{item.location}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openMaterialHistory(item)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        History
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Material History Modal */}
      <MaterialHistoryModal
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal({ isOpen: false, material: null })}
        material={historyModal.material}
      />
    </div>
  );
};

export default StorePage;

