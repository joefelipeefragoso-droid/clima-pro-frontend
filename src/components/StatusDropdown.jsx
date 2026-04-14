import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { BUDGET_STATUS, STATUS_GROUPS, normalizeStatus } from '../utils/statusConstants';

export default function StatusDropdown({ currentStatus, onStatusChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const normalized = normalizeStatus(currentStatus);
  const statusInfo = BUDGET_STATUS[normalized] || BUDGET_STATUS.em_aberto;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (statusKey) => {
    if (disabled) return;
    onStatusChange(statusKey);
    setIsOpen(false);
  };

  return (
    <div className="status-dropdown-container" ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="status-dropdown-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '6px',
          border: `1px solid ${statusInfo.color}`,
          background: statusInfo.bg,
          color: statusInfo.color,
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          minWidth: '160px',
          justifyContent: 'space-between'
        }}
      >
        <span>{statusInfo.label}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div 
          className="status-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 9999,
            width: '240px',
            background: '#1e293b', // Slate 800
            border: '1px solid #334155', // Slate 700
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            padding: '4px'
          }}
        >
          {STATUS_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="status-group">
              <div style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                color: '#94a3b8',
                padding: '8px 12px 4px',
                fontWeight: '700',
                letterSpacing: '0.05em'
              }}>
                {group.label}
              </div>
              {group.options.map((optKey) => {
                const opt = BUDGET_STATUS[optKey];
                const isSelected = normalized === optKey;
                return (
                  <div
                    key={optKey}
                    onClick={() => handleSelect(optKey)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: opt.color }}></div>
                      <span style={{ color: isSelected ? '#fff' : '#cbd5e1', fontSize: '0.875rem' }}>{opt.label}</span>
                    </div>
                    {isSelected && <Check size={14} color="#10b981" />}
                  </div>
                );
              })}
              {gIdx < STATUS_GROUPS.length - 1 && <div style={{ height: '1px', background: '#334155', margin: '4px 0' }}></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
