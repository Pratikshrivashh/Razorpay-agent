import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Settings,
  Zap,
  RefreshCw,
  Store,
  Check,
  LayoutDashboard,
  Shield,
  Network,
  Sliders,
  Bot,
  User,
  ShieldCheck,
  AlertTriangle,
  X
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
  const [testMode] = useState(true);
  const [showRealModeModal, setShowRealModeModal] = useState(false);
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

  const handleToggleTestMode = () => {
    setShowRealModeModal(true);
  };

  return (
    <div className="w-full sticky top-0 z-40 bg-[#0f1115] border-b border-neutral-800 shadow-md">
      {/* 1. Main Black Top Header Bar */}
      <header className="w-full px-6 h-14 flex items-center justify-between text-white">
        {/* Left Section: Razorpay Risk Shield Brand & Navigation CTAs */}
        <div className="flex items-center gap-6">
          {/* Brand Logo & Demo Sample Heading */}
          <div
            onClick={() => onSelectTab('overview')}
            className="flex items-center gap-2.5 cursor-pointer select-none group flex-shrink-0"
            title="Razorpay Risk Shield (Demo Sample)"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-[0_0_12px_rgba(37,99,235,0.8)] border border-blue-400/40 group-hover:scale-105 transition-transform flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div className="whitespace-nowrap">
              <div className="font-extrabold text-sm tracking-tight text-white whitespace-nowrap leading-tight">
                Razorpay Risk Shield
              </div>
              <div className="text-[10px] text-emerald-400 font-bold tracking-wide flex items-center gap-1 leading-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Demo Sample</span>
              </div>
            </div>
          </div>

          {/* Custom Navigation CTAs */}
          <nav className="hidden lg:flex items-center gap-1 text-xs">
            <button
              onClick={() => onSelectTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onSelectTab('alerts')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all relative ${
                activeTab === 'alerts'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Mule Triage</span>
              {unreviewedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-red-600 text-white">
                  {unreviewedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('analytics')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-blue-400" />
              <span>Risk Topology</span>
            </button>

            <button
              onClick={() => onSelectTab('settings')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-neutral-400" />
              <span>Rules & Engine</span>
            </button>
          </nav>
        </div>

        {/* Right Section: Merchant Selector, Interactive Dark Search & Actions */}
        <div className="flex items-center gap-3">
          {/* Merchant Selector Dropdown */}
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

          {/* Interactive Search Bar */}
          <div ref={searchContainerRef} className="relative hidden md:block w-60 lg:w-72">
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
              placeholder="Search Merchant ID or Name..."
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

          {/* Quick Controls */}
          <button
            onClick={onRefresh}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#18191c] hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
            title="Refresh State"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
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

      {/* 2. Integrated Compact Notch Bar */}
      <div className="bg-[#14161b] border-t border-neutral-800 px-6 py-1.5 flex items-center justify-between text-xs text-neutral-300 font-mono">
        <div className="flex items-center gap-3">
          {/* Test Mode Toggle Button */}
          <div
            onClick={handleToggleTestMode}
            className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-0.5 rounded-full border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors group"
            title="Click to toggle Test / Real Mode"
          >
            <div className="w-7 h-4 rounded-full flex items-center px-0.5 bg-emerald-500 justify-end transition-colors">
              <div className="w-3 h-3 rounded-full bg-white shadow-xs"></div>
            </div>
            <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase">TEST MODE</span>
          </div>

          <span className="text-neutral-700">|</span>

          <span className="text-[11px] text-neutral-400 font-sans font-medium flex items-center gap-1.5">
            Active Protection: <strong className="text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Auto-Freeze Shield Active (Score ≥ 80)</strong>
          </span>
        </div>

        {/* Live Attack Simulator Trigger */}
        <button
          onClick={onOpenSimulation}
          className="flex items-center gap-1.5 text-xs font-sans font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md transition-all shadow-xs"
          title="Inject Live Mule Attack Scenario"
        >
          <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
          <span>Simulate Mule Attacks</span>
        </button>
      </div>

      {/* 3. Real Mode Not Available Alert Modal */}
      {showRealModeModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-[#18191c] border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-white space-y-4 relative">
            <button
              onClick={() => setShowRealModeModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Not Available in Real Mode</h3>
                <p className="text-xs text-neutral-400 font-medium">Demo Sample Environment Notice</p>
              </div>
            </div>

            <div className="bg-neutral-900/90 p-4 rounded-xl border border-neutral-800 text-xs text-neutral-300 space-y-2 font-sans">
              <p className="leading-relaxed">
                Switching to live production / Real Mode is restricted in this <strong className="text-amber-400 font-semibold">Demo Sample</strong> environment.
              </p>
              <p className="text-neutral-400 leading-relaxed text-[11px]">
                All 12-signal mule vector detections, synthetic fraud injections, and score mitigations operate safely under <strong>Test Mode</strong>.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowRealModeModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Got It (Continue in Test Mode)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
