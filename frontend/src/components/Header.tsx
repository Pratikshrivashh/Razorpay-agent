import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, Bot, Zap, RefreshCw, Store, Check } from 'lucide-react';
import { Merchant } from '../types';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  merchants: Merchant[];
  selectedMerchant: Merchant | null;
  onSelectMerchant: (merchant: Merchant) => void;
  unreviewedCount: number;
  onOpenSimulation: () => void;
  onToggleCopilot: () => void;
  copilotOpen: boolean;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  merchants,
  selectedMerchant,
  onSelectMerchant,
  unreviewedCount,
  onOpenSimulation,
  onToggleCopilot,
  copilotOpen,
  onRefresh,
  isLoading
}) => {
  // Search Bar Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const getTabName = (tab: string) => {
    switch (tab) {
      case 'alerts': return 'Alert Triage & Review';
      case 'analytics': return 'Network Map & Analytics';
      case 'settings': return 'Rules & System Settings';
      default: return 'Overview';
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter merchants by ID, Name, or Category
  const filteredMerchants = (merchants || []).filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.business_category.toLowerCase().includes(q)
    );
  }).slice(0, 6);

  const handleSelectMerchantResult = (m: Merchant) => {
    onSelectMerchant(m);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredMerchants.length > 0) {
      handleSelectMerchantResult(filteredMerchants[0]);
    }
  };

  return (
    <header className="bg-surface flex justify-between items-center w-full px-8 py-3.5 sticky top-0 z-30 border-b border-[#E2E8F0] shadow-2xs">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium text-[#1b1b23] flex items-center gap-2">
          <span>{getTabName(activeTab)}</span>
          <span className="text-[#c7c4d7]">/</span>
          <span className="text-xs px-3 py-1 rounded-full border border-[#E2E8F0] bg-[#ffffff] text-blue-600 font-semibold">
            {activeTab === 'overview' ? 'Dashboard' : 'Active View'}
          </span>
          <button
            onClick={() => onSelectTab('analytics')}
            className="text-xs px-3 py-1 text-[#464554] hover:text-blue-600 transition-colors font-medium"
          >
            Project Hub
          </button>
          <button
            onClick={() => onSelectTab('alerts')}
            className="text-xs px-3 py-1 text-[#464554] hover:text-blue-600 transition-colors font-medium"
          >
            Activity
          </button>
        </div>
      </div>

      {/* Right Controls: Merchant Selector, Interactive Search, Quick Actions */}
      <div className="flex items-center gap-4">
        {/* Merchant Selector Dropdown */}
        <select
          value={selectedMerchant?.id || ''}
          onChange={(e) => {
            const m = merchants?.find((item) => item.id === e.target.value);
            if (m) onSelectMerchant(m);
          }}
          className="bg-white border border-[#E2E8F0] text-gray-700 text-xs font-semibold rounded-full px-3 py-1.5 outline-none cursor-pointer hover:border-gray-300 shadow-sm max-w-[260px] truncate"
        >
          {merchants && merchants.length > 0 ? (
            merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.business_category})
              </option>
            ))
          ) : (
            <>
              <option value="mch_01">Aura Handcrafted Jewels (Fashion &amp; Luxury)</option>
              <option value="mch_02">Apex Digital Electronics (Tech Retail)</option>
              <option value="mch_03">Swift Pay Logistics (Services &amp; Utility)</option>
            </>
          )}
        </select>

        {/* Fully Interactive Search & Autocomplete Bar */}
        <div ref={searchContainerRef} className="relative hidden md:block w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search Merchant ID or Name..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E2E8F0] rounded-full text-xs text-[#1b1b23] placeholder:text-[#767586] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
          />

          {/* Autocomplete Dropdown Results */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 max-h-72 overflow-y-auto">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                <span>Matching Merchants</span>
                <span>{filteredMerchants.length} Found</span>
              </div>

              {filteredMerchants.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredMerchants.map((m) => {
                    const isSelected = m.id === selectedMerchant?.id;
                    const merchantBadge = m.id.slice(0, 8).toUpperCase();
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleSelectMerchantResult(m)}
                        className={`p-2.5 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-blue-50/80' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                            <Store className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{m.name}</span>
                              <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono font-bold">
                                {merchantBadge}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[170px]">
                              {m.business_category}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-600"></span> Active
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No merchants found matching "<strong className="text-slate-800">{searchQuery}</strong>"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Simulation Trigger Button */}
        <button
          onClick={onOpenSimulation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all shadow-2xs"
          title="Inject Live Mule Pattern / Demo Simulation"
        >
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Simulate Mules</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 border border-[#E2E8F0] transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => onSelectTab('alerts')}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-[#464554] transition-colors relative"
          title="Mule Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreviewedCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => onSelectTab('settings')}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-[#464554] transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Profile Avatar */}
        <div
          className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold border border-[#E2E8F0] cursor-pointer"
          title="Razorpay Risk Analyst"
        >
          RA
        </div>
      </div>
    </header>
  );
};
