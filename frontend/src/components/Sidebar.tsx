import React from 'react';
import {
  LayoutDashboard,
  Shield,
  Network,
  History,
  BarChart2,
  Settings,
  HelpCircle,
  LogOut,
  RotateCcw
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  unreviewedCount: number;
  onResetData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unreviewedCount,
  onResetData
}) => {
  const mainNav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'alerts', label: 'Mule Alerts', icon: Shield, badge: unreviewedCount },
    { id: 'analytics', label: 'Network Map & Analytics', icon: Network },
    { id: 'settings', label: 'Rules & Settings', icon: Settings },
  ];

  return (
    <nav className="bg-[#ffffff] border-r border-[#E2E8F0] h-[calc(100vh-5rem)] w-20 hover:w-64 transition-all duration-300 fixed left-0 top-20 flex flex-col py-6 z-30 group shadow-2xs">
      {/* Brand Icon & Name */}
      <div className="px-6 mb-8 flex items-center gap-4 whitespace-nowrap overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-xs">
          R
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="text-sm font-extrabold text-[#1b1b23] leading-tight">Razorpay Risk Shield</div>
          <div className="text-xs text-slate-500 font-medium">Demo Sample</div>
        </div>
      </div>

      {/* Main Nav Items (4 Sidebar Pages) */}
      <div className="flex flex-col gap-1.5 flex-grow">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`rounded-xl mx-2.5 px-3.5 py-3 flex items-center gap-4 transition-all whitespace-nowrap overflow-hidden text-xs font-semibold ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#464554] hover:bg-blue-50 hover:text-blue-700'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-grow text-left">
                {item.label}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                    isActive ? 'bg-white text-blue-600' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-1 mt-auto border-t border-[#E2E8F0] pt-4">
        <button
          onClick={onResetData}
          className="text-[#464554] hover:bg-[#efecf8] hover:text-red-600 rounded-xl mx-2.5 px-3.5 py-2.5 flex items-center gap-4 transition-all whitespace-nowrap overflow-hidden text-xs font-semibold"
          title="Reset Baseline Data"
        >
          <RotateCcw className="w-5 h-5 flex-shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Reset Demo State
          </span>
        </button>

        <a
          href="https://razorpay.com"
          target="_blank"
          rel="noreferrer"
          className="text-[#464554] hover:bg-[#efecf8] rounded-xl mx-2.5 px-3.5 py-2.5 flex items-center gap-4 transition-all whitespace-nowrap overflow-hidden text-xs font-semibold"
          title="Razorpay Support"
        >
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Support Docs
          </span>
        </a>
      </div>
    </nav>
  );
};
