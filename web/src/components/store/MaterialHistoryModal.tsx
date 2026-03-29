import { useState, useEffect } from 'react';
import { inventoryApi } from '../../api/procurement.api';
import type { StockMovement } from '../../types/procurement.types';

type MaterialHistoryProject = {
  id: string;
  name: string;
};

interface MaterialHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: {
    name: string;
    unit: string;
    location: string;
    allocationStatus: string;
    allocationTarget: string;
    projects: MaterialHistoryProject[];
  } | null;
}

const MaterialHistoryModal = ({ isOpen, onClose, material }: MaterialHistoryModalProps) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load movements when modal opens
  useEffect(() => {
    if (isOpen && material && material.projects.length > 0) {
      loadMovements();
    }
  }, [isOpen, material]);

  const loadMovements = async () => {
    if (!material) return;

    setLoading(true);
    setError('');

    try {
      // Load movements from all projects that contain this material
      const movementPromises = material.projects.map((project) => inventoryApi.getMovements(project.id));

      const results = await Promise.allSettled(movementPromises);
      const movementMap = new Map<string, StockMovement>();

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const projectMovements = result.value.data?.data || result.value.data || [];
          // Filter movements for this specific material
          const materialMovements = projectMovements.filter((movement: StockMovement) => 
            movement.stockItem?.name === material.name && 
            movement.stockItem?.unit === material.unit &&
            (!material.location || material.location === '—' || movement.stockItem?.location === material.location)
          );
          materialMovements.forEach((movement: StockMovement) => {
            movementMap.set(movement.id, movement);
          });
        }
      });

      const allMovements = Array.from(movementMap.values());
      // Sort by date (newest first)
      allMovements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMovements(allMovements);
    } catch {
      setError('Failed to load material history');
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-600 bg-green-50';
      case 'out': return 'text-red-600 bg-red-50';
      case 'adjustment': return 'text-blue-600 bg-blue-50';
      case 'transfer': return 'text-amber-700 bg-amber-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'in': return 'Stock In';
      case 'out': return 'Stock Out';
      case 'adjustment': return 'Adjustment';
      case 'transfer': return 'Transfer';
      default: return type;
    }
  };

  if (!isOpen || !material) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Material History</h2>
              <p className="text-sm text-gray-500 mt-1">
                {material.name} ({material.unit}) - {material.location}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {material.allocationStatus}
                {material.allocationTarget !== '—'
                  ? ` · ${material.allocationTarget}`
                  : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No movement history found for this material.
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div key={movement.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMovementTypeColor(movement.type)}`}>
                        {getMovementTypeLabel(movement.type)}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity} {material.unit}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(movement.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {movement.createdBy?.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {movement.referenceType}
                      </p>
                    </div>
                  </div>
                  {movement.notes && (
                    <p className="text-sm text-gray-600 mt-2">
                      Notes: {movement.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialHistoryModal;
