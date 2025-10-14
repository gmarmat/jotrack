'use client';

import { Plus, X } from 'lucide-react';

interface DynamicListItem {
  url: string;
  role?: string;
}

interface DynamicListProps {
  label: string;
  items: DynamicListItem[];
  onChange: (items: DynamicListItem[]) => void;
  showRoleField?: boolean;
  placeholder?: string;
  rolePlaceholder?: string;
  testId?: string;
}

export default function DynamicList({
  label,
  items,
  onChange,
  showRoleField = false,
  placeholder = "Enter URL",
  rolePlaceholder = "Role/Title",
  testId,
}: DynamicListProps) {
  const addItem = () => {
    onChange([...items, { url: '', role: '' }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: 'url' | 'role', value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-900">{label}</label>

      {items.length === 0 && (
        <p className="text-sm text-gray-500 italic">No entries yet</p>
      )}

      {items.map((item, index) => (
        <div 
          key={index} 
          className="flex gap-2 items-start"
          data-testid={testId ? `${testId}-item-${index}` : undefined}
        >
          {/* URL Input */}
          <div className={showRoleField ? 'flex-1' : 'flex-[2]'}>
            <input
              type="url"
              value={item.url}
              onChange={(e) => updateItem(index, 'url', e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              data-testid={testId ? `${testId}-url-${index}` : undefined}
            />
          </div>

          {/* Role Input (Optional) */}
          {showRoleField && (
            <div className="flex-1">
              <input
                type="text"
                value={item.role || ''}
                onChange={(e) => updateItem(index, 'role', e.target.value)}
                placeholder={rolePlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                data-testid={testId ? `${testId}-role-${index}` : undefined}
              />
            </div>
          )}

          {/* Remove Button */}
          <button
            onClick={() => removeItem(index)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Remove"
            data-testid={testId ? `${testId}-remove-${index}` : undefined}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Add Button */}
      <button
        onClick={addItem}
        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-blue-200 hover:border-blue-300"
        data-testid={testId ? `${testId}-add-button` : undefined}
      >
        <Plus className="w-4 h-4" />
        Add {label}
      </button>
    </div>
  );
}

