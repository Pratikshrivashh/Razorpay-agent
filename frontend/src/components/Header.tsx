import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Settings,
  Zap,
  RefreshCw,
  Store,
  Check,
  Home,
  CreditCard,
  ExternalLink,
  ChevronDown,
  Activity,
  User,
  Sliders
} from 'lucide-react';
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
  const [testMode, setTestMode] = useState(true);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
    <div className="relative w-full z-40">
      {/* 1. Black Razorpay Enterprise Header Bar */}
      <header className="bg-black text-white w-full px-6 h-14 flex items-center justify-between sticky top-0 border-b border-neutral-800 shadow-md">
        {/* Left Section: Razorpay Logo & Product Navigation */}
        <div className="flex items-center gap-6">
          {/* Razorpay Brand Logo */}
          <div
            onClick={() => onSelectTab('overview')}
            className="flex items-center gap-1 cursor-pointer select-none group"
            title="Razorpay Sentinel Dashboard"
          >
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center font-black italic text-white text-xs shadow-[0_0_10px_rgba(37,99,235,0.8)]">
              R
            </div>
            <span className="font-extrabold italic text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors">
              Razorpay
            </span>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden lg:flex items-center gap-1 text-xs">
            <button
              onClick={() => onSelectTab('overview')}
              className={`px-3 py-1.5 rounded-t-md font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-b from-blue-900/40 to-transparent border-b-2 border-blue-500 text-white font-bold shadow-[0_4px_12px_rgba(59,130,246,0.5)]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Razorpay Home</span>
            </button>

            <button
              onClick={() => onSelectTab('alerts')}
              className={`px-3 py-1.5 rounded-t-md font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'alerts'
                  ? 'bg-gradient-to-b from-blue-900/40 to-transparent border-b-2 border-blue-500 text-white font-bold shadow-[0_4px_12px_rgba(59,130,246,0.5)]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              <span>Payments</span>
            </button>

            <button
              onClick={() => onSelectTab('analytics')}
              className={`px-3 py-1.5 rounded-t-md font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-b from-blue-900/40 to-transparent border-b-2 border-blue-500 text-white font-bold shadow-[0_4px_12px_rgba(59,130,246,0.5)]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
            >
              <span>Banking+</span>
            </button>

            <button
              onClick={() => onSelectTab('analytics')}
              className="px-3 py-1.5 rounded-t-md text-neutral-400 hover:text-white hover:bg-neutral-900/60 font-medium flex items-center gap-1 transition-all"
            >
              <span>Payroll</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </button>

            <button
              onClick={() => onSelectTab('settings')}
              className={`px-3 py-1.5 rounded-t-md font-medium flex items-center gap-1 transition-all ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-b from-blue-900/40 to-transparent border-b-2 border-blue-500 text-white font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
            >
              <span>More</span>
              <ChevronDown className="w-3 h-3 text-neutral-500" />
            </button>
          </nav>
        </div>

        {/* Right Section: Merchant Selector, Interactive Dark Search & User Controls */}
        <div className="flex items-center gap-3">
          {/* Merchant Dropdown Selector */}
          <select
            value={selectedMerchant?.id || ''}
            onChange={(e) => {
              const m = merchants?.find((item) => item.id === e.target.value);
              if (m) onSelectMerchant(m);
            }}
            className="bg-[#18191c] border border-neutral-800 text-neutral-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-neutral-700 max-w-[200px] truncate"
          >
            {merchants && merchants.length > 0 ? (
              merchants.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#18191c] text-white">
                  {m.name} ({m.business_category})
                </option>
              ))
            ) : (
              <>
                <option value="mch_01">Aura Handcrafted Jewels</option>
                <option value="mch_02">Apex Digital Electronics</option>
                <option value="mch_03">GreenRoot Grocers</option>
              </>
            )}
          </select>

          {/* Interactive Dark Search Bar */}
          <div ref={searchContainerRef} className="relative hidden md:block w-64 lg:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search payment products, settings, and more"
              className="w-full pl-8 pr-3 py-1.5 bg-[#18191c] border border-neutral-800 rounded-lg text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />

            {/* Dark Autocomplete Results Dropdown */}
            {isSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#18191c] rounded-xl border border-neutral-800 shadow-2xl overflow-hidden z-50 animate-in fade-in duration-100 max-h-72 overflow-y-auto">
                <div className="px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex justify-between items-center">
                  <span>Matching Merchants</span>
                  <span>{filteredMerchants.length} Found</span>
                </div>

                {filteredMerchants.length > 0 ? (
                  <div className="divide-y divide-neutral-800">
                    {filteredMerchants.map((m) => {
                      const isSelected = m.id === selectedMerchant?.id;
                      const merchantBadge = m.id.slice(0, 8).toUpperCase();
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleSelectMerchantResult(m)}
                          className={`p-2.5 hover:bg-blue-950/60 cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected ? 'bg-blue-950/80' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-900/60 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 border border-blue-700/40">
                              <Store className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{m.name}</span>
                                <span className="text-[9px] bg-neutral-800 text-neutral-300 px-1.5 py-0.2 rounded font-mono font-bold">
                                  {merchantBadge}
                                </span>
                              </div>
                              <div className="text-[10px] text-neutral-400 truncate max-w-[170px]">
                                {m.business_category}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 text-[9px] font-bold flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-emerald-400"></span> Active
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-neutral-400">
                    No merchants found matching "<strong className="text-white">{searchQuery}</strong>"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Action Icons: Analytics, Alerts, Profile Avatar */}
          <button
            onClick={() => onSelectTab('analytics')}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#18191c] hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
            title="System Analytics & Network Map"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSelectTab('alerts')}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#18191c] hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors relative"
            title="Mule Alerts"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreviewedCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {/* Profile Avatar */}
          <div
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center border border-neutral-700 cursor-pointer shadow-sm"
            title="Razorpay Risk Analyst"
          >
            <User className="w-4 h-4 text-neutral-300" />
          </div>
        </div>
      </header>

      {/* 2. Curved Razorpay Control Notch (Centering over Page Canvas) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-14 bg-black border-x border-b border-neutral-800 rounded-b-2xl px-5 py-1 flex items-center gap-3.5 shadow-2xl z-50 text-xs text-neutral-300 font-mono">
        {/* TEST Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-neutral-900/90 px-2.5 py-0.5 rounded-full border border-neutral-800">
          <div
            onClick={() => setTestMode(!testMode)}
            className={`w-7 h-4 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${
              testMode ? 'bg-emerald-500 justify-end' : 'bg-neutral-600 justify-start'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-white shadow-xs"></div>
          </div>
          <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase">T E S T</span>
        </div>

        <span className="text-neutral-700 font-sans">|</span>

        {/* Notch Tool: Simulate Mules Trigger */}
        <button
          onClick={onOpenSimulation}
          className="flex items-center gap-1.5 text-[11px] font-sans font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-900/80 px-2.5 py-0.5 rounded-md border border-blue-800/60 transition-all shadow-xs"
          title="Inject Live Mule Attack Scenario"
        >
          <Zap className="w-3 h-3 text-blue-400 animate-pulse" />
          <span>Simulate Mules</span>
        </button>

        {/* Notch Tool: Refresh */}
        <button
          onClick={onRefresh}
          className="text-neutral-400 hover:text-white transition-colors p-0.5"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
        </button>

        {/* Notch Tool: Settings */}
        <button
          onClick={() => onSelectTab('settings')}
          className="text-neutral-400 hover:text-white transition-colors p-0.5"
          title="Rules & Settings"
        >
          <Sliders className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
