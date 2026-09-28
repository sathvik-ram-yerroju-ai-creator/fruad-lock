'use client';

import React, { useState } from 'react';
import {
  Store,
  ShieldCheck,
  Search,
  Wrench,
  Zap,
  Sparkles,
  Shirt,
  ShoppingBag,
  AirVent,
  Hammer,
  Truck,
  Star,
  Clock,
  MapPin,
  Calendar,
  CheckCircle,
  PlusCircle,
  LogIn,
  UserCheck,
  ArrowRight,
  Filter,
  Check,
  Building,
  PhoneCall,
  X,
} from 'lucide-react';
import { UserProfile, UserRole } from '@/types/auth';

interface VendorItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewsCount: number;
  jobsCompleted: number;
  phone: string;
  blocksServed: string[];
  startingPrice: string;
  availability: 'Available Today' | 'Next Slot: Tomorrow' | 'Busy';
  verifiedGatePass: boolean;
  featured: boolean;
  avatar: string;
  description: string;
}

interface ServiceRequest {
  id: string;
  residentName: string;
  apartmentBlock: string;
  apartmentUnit: string;
  category: string;
  description: string;
  urgency: 'urgent' | 'standard' | 'flexible';
  status: 'open' | 'assigned' | 'completed';
  createdAt: string;
}

interface AriseMarketplaceHomeProps {
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onNavigateToVendorDashboard: () => void;
  onNavigateToAdminDashboard?: () => void;
}

const INITIAL_VENDORS: VendorItem[] = [
  {
    id: 'v1',
    name: 'Sharma Electrical Works',
    category: 'Electrical',
    rating: 4.9,
    reviewsCount: 142,
    jobsCompleted: 380,
    phone: '+91 98765 43210',
    blocksServed: ['Block A', 'Block B', 'Block C', 'Block D'],
    startingPrice: '₹199',
    availability: 'Available Today',
    verifiedGatePass: true,
    featured: true,
    avatar: 'SE',
    description: 'Expert residential electrician for power tripping, MCB, switchboard repairs, and heavy appliance cabling.',
  },
  {
    id: 'v2',
    name: 'AquaPure Plumbing & Sanitary',
    category: 'Plumbing',
    rating: 4.8,
    reviewsCount: 118,
    jobsCompleted: 295,
    phone: '+91 98234 56781',
    blocksServed: ['All Blocks (A to E)'],
    startingPrice: '₹249',
    availability: 'Available Today',
    verifiedGatePass: true,
    featured: true,
    avatar: 'AP',
    description: 'Specialists in high-pressure bathroom fittings, concealed leak detection, water tank cleaning, and RO service.',
  },
  {
    id: 'v3',
    name: 'CleanNest Society Housekeeping',
    category: 'Housekeeping',
    rating: 4.9,
    reviewsCount: 204,
    jobsCompleted: 512,
    phone: '+91 97123 45678',
    blocksServed: ['All Blocks'],
    startingPrice: '₹499',
    availability: 'Next Slot: Tomorrow',
    verifiedGatePass: true,
    featured: true,
    avatar: 'CN',
    description: 'Trained, background-verified housekeeping staff for apartment deep cleaning, kitchen sanitization, and sofa shampooing.',
  },
  {
    id: 'v4',
    name: 'GreenFarm Fresh Society Mart',
    category: 'Groceries',
    rating: 4.7,
    reviewsCount: 310,
    jobsCompleted: 840,
    phone: '+91 96543 21098',
    blocksServed: ['Direct Doorstep Delivery'],
    startingPrice: '₹99 min order',
    availability: 'Available Today',
    verifiedGatePass: true,
    featured: false,
    avatar: 'GF',
    description: 'Farm-fresh organic vegetables, A2 organic milk, daily bread, and pantry supplies delivered by 7:00 AM.',
  },
  {
    id: 'v5',
    name: 'CoolBreeze Air Conditioning Care',
    category: 'AC & Appliances',
    rating: 4.8,
    reviewsCount: 89,
    jobsCompleted: 178,
    phone: '+91 95432 10987',
    blocksServed: ['Block A', 'Block B', 'Block C'],
    startingPrice: '₹399',
    availability: 'Available Today',
    verifiedGatePass: true,
    featured: false,
    avatar: 'CB',
    description: 'Split and window AC servicing, jet wash cleaning, gas leakage rectification, and compressor checkup.',
  },
  {
    id: 'v6',
    name: 'UrbanCare Dry Cleaners & Press',
    category: 'Laundry',
    rating: 4.6,
    reviewsCount: 164,
    jobsCompleted: 430,
    phone: '+91 94321 09876',
    blocksServed: ['All Blocks'],
    startingPrice: '₹40 / pc',
    availability: 'Available Today',
    verifiedGatePass: true,
    featured: false,
    avatar: 'UC',
    description: 'Doorstep laundry pickup, steam pressing, curtain cleaning, and delicate fabric dry cleaning with 24h turnaround.',
  },
  {
    id: 'v7',
    name: 'MasterCraft Wood & Lock Solutions',
    category: 'Carpentry',
    rating: 4.9,
    reviewsCount: 76,
    jobsCompleted: 156,
    phone: '+91 93210 98765',
    blocksServed: ['All Blocks'],
    startingPrice: '₹299',
    availability: 'Next Slot: Tomorrow',
    verifiedGatePass: true,
    featured: false,
    avatar: 'MC',
    description: 'Digital door lock installation, hinge realignment, custom wardrobe repairs, and modular kitchen adjustments.',
  },
];

const INITIAL_REQUESTS: ServiceRequest[] = [
  {
    id: 'req-1',
    residentName: 'Priya Narang',
    apartmentBlock: 'Tower B',
    apartmentUnit: '402',
    category: 'Plumbing',
    description: 'Kitchen sink drain line is backing up. Need technician between 11 AM - 1 PM today.',
    urgency: 'urgent',
    status: 'open',
    createdAt: '25 mins ago',
  },
  {
    id: 'req-2',
    residentName: 'Amitabh Sen',
    apartmentBlock: 'Tower A',
    apartmentUnit: '904',
    category: 'Electrical',
    description: 'Balcony power socket tripping when EV charger is plugged in. Needs 16A breaker check.',
    urgency: 'standard',
    status: 'assigned',
    createdAt: '1 hour ago',
  },
  {
    id: 'req-3',
    residentName: 'Kavita Reddy',
    apartmentBlock: 'Tower C',
    apartmentUnit: '102',
    category: 'AC & Appliances',
    description: 'Master bedroom inverter AC water dripping inside wall panel.',
    urgency: 'standard',
    status: 'open',
    createdAt: '2 hours ago',
  },
];

export function AriseMarketplaceHome({
  currentUser,
  onOpenAuthModal,
  onNavigateToVendorDashboard,
}: AriseMarketplaceHomeProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vendors, setVendors] = useState<VendorItem[]>(INITIAL_VENDORS);
  const [requests, setRequests] = useState<ServiceRequest[]>(INITIAL_REQUESTS);

  // Booking Modal State
  const [bookingVendor, setBookingVendor] = useState<VendorItem | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('2026-09-29');
  const [bookingSlot, setBookingSlot] = useState<string>('Morning (9 AM - 12 PM)');
  const [bookingBlock, setBookingBlock] = useState<string>(currentUser?.apartment_block || 'Tower B');
  const [bookingUnit, setBookingUnit] = useState<string>(currentUser?.apartment_unit || '402');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // New Request Modal State
  const [isPostRequestModalOpen, setIsPostRequestModalOpen] = useState<boolean>(false);
  const [newReqCategory, setNewReqCategory] = useState<string>('Electrical');
  const [newReqDesc, setNewReqDesc] = useState<string>('');
  const [newReqUrgency, setNewReqUrgency] = useState<'urgent' | 'standard' | 'flexible'>('standard');
  const [newReqBlock, setNewReqBlock] = useState<string>(currentUser?.apartment_block || 'Tower A');
  const [newReqUnit, setNewReqUnit] = useState<string>(currentUser?.apartment_unit || '101');

  // Filter vendors
  const filteredVendors = vendors.filter((vendor) => {
    const matchesCat = selectedCategory === 'All' || vendor.category === selectedCategory;
    const matchesQuery =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    setBookingSuccessMsg(
      `Appointment booked with ${bookingVendor?.name} for ${bookingSlot} on ${bookingDate}. Gate pass pre-approval code: AP-${Math.floor(1000 + Math.random() * 9000)}`
    );
    setTimeout(() => {
      setBookingVendor(null);
      setBookingSuccessMsg(null);
      setBookingNotes('');
    }, 2800);
  };

  const handlePostRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqDesc.trim()) return;

    const newReq: ServiceRequest = {
      id: `req-${Date.now()}`,
      residentName: currentUser?.display_name || 'Resident',
      apartmentBlock: newReqBlock,
      apartmentUnit: newReqUnit,
      category: newReqCategory,
      description: newReqDesc,
      urgency: newReqUrgency,
      status: 'open',
      createdAt: 'Just now',
    };

    setRequests([newReq, ...requests]);
    setIsPostRequestModalOpen(false);
    setNewReqDesc('');
  };

  const categories = [
    { name: 'All', icon: Store },
    { name: 'Electrical', icon: Zap },
    { name: 'Plumbing', icon: Wrench },
    { name: 'Housekeeping', icon: Sparkles },
    { name: 'Groceries', icon: ShoppingBag },
    { name: 'AC & Appliances', icon: AirVent },
    { name: 'Laundry', icon: Shirt },
    { name: 'Carpentry', icon: Hammer },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 pb-20">
      {/* Top Banner / Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0B1528] via-[#070E1E] to-[#070B14] border-b border-cyan-500/20 pt-8 pb-12 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_50%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header metadata badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-medium">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>Arise Grandeur Residential Community</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-400/80">Blocks A — E</span>
            </div>

            {/* Role indicator or switchers */}
            <div className="flex items-center gap-2">
              {currentUser?.role === 'vendor' ? (
                <button
                  onClick={onNavigateToVendorDashboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Open Vendor Dashboard</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : currentUser ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Verified Resident: <strong>{currentUser.apartment_block} - {currentUser.apartment_unit}</strong>
                  </span>
                </div>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-900/40 transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>
          </div>

          {/* Hero Titles */}
          <div className="max-w-3xl mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3 leading-tight">
              Arise <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">Marketplace</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              The trusted community marketplace for apartment residents. Book verified electricians, plumbers, house cleaners, and order daily society essentials with instant gate-pass pre-clearance.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>100% Verified</span>
              </div>
              <p className="text-xl font-bold text-white">48+ Staff</p>
              <p className="text-[11px] text-slate-400">Police & Society Cleared</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Fast Dispatch</span>
              </div>
              <p className="text-xl font-bold text-white">&lt; 20 Mins</p>
              <p className="text-[11px] text-slate-400">Average On-Campus Arrival</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Rating</span>
              </div>
              <p className="text-xl font-bold text-white">4.9 / 5.0</p>
              <p className="text-[11px] text-slate-400">1,240+ Resident Reviews</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
                <Building className="w-4 h-4 text-indigo-400" />
                <span>Apartments</span>
              </div>
              <p className="text-xl font-bold text-white">650 Units</p>
              <p className="text-[11px] text-slate-400">Active Society Network</p>
            </div>
          </div>

          {/* Search and Action Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search electrician, plumber, AC repair, groceries, laundry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>

            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuthModal();
                } else {
                  setIsPostRequestModalOpen(true);
                }
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-950 transition-all cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Society Request</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Category Pills */}
        <section className="mb-8 overflow-x-auto pb-2 scrollbar-thin">
          <div className="flex items-center gap-2 min-w-max">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Vendors Listing Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>Verified Society Vendors</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono">
                  {filteredVendors.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Staff pre-approved with active RFID/Security Gate-Pass clearances
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Showing: {selectedCategory}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="group relative p-5 rounded-2xl bg-gradient-to-b from-[#0D1527] to-[#0A101E] border border-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-col justify-between"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600/30 to-blue-700/30 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300 text-sm shadow-inner shrink-0">
                        {vendor.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                          {vendor.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400 font-medium">
                            {vendor.category}
                          </span>
                          <span className="flex items-center gap-1 text-amber-300 font-semibold">
                            <Star className="w-3 h-3 fill-amber-300" />
                            {vendor.rating}
                          </span>
                          <span className="text-slate-500 text-[10px]">({vendor.reviewsCount})</span>
                        </div>
                      </div>
                    </div>

                    {vendor.verifiedGatePass && (
                      <span
                        className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        title="Verified Society Gate Pass"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                    {vendor.description}
                  </p>

                  {/* Coverage & Availability */}
                  <div className="space-y-1.5 mb-4 text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span>Serves:</span>
                      </span>
                      <span className="text-slate-300 font-medium">{vendor.blocksServed.join(', ')}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>Status:</span>
                      </span>
                      <span
                        className={`font-medium ${
                          vendor.availability === 'Available Today' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {vendor.availability}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Society Jobs Done:</span>
                      <span className="text-slate-200 font-mono font-semibold">{vendor.jobsCompleted}+</span>
                    </div>
                  </div>
                </div>

                {/* Price & Booking action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Starts from</span>
                    <span className="text-sm font-bold text-white">{vendor.startingPrice}</span>
                  </div>

                  <button
                    onClick={() => {
                      if (!currentUser) {
                        onOpenAuthModal();
                      } else {
                        setBookingVendor(vendor);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
                  >
                    <span>Book Service</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Community Service Requests Board */}
        <section className="p-6 rounded-2xl bg-[#091122] border border-cyan-500/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Resident Service & Maintenance Board</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono">
                  Live
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Recent requests from apartment residents looking for verified vendors or society assistance
              </p>
            </div>

            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuthModal();
                } else {
                  setIsPostRequestModalOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Service Need</span>
            </button>
          </div>

          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white">{req.residentName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                      {req.apartmentBlock} - Unit {req.apartmentUnit}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-medium">
                      {req.category}
                    </span>
                    {req.urgency === 'urgent' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 border border-red-500/40 text-red-300 font-bold animate-pulse">
                        URGENT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{req.description}</p>
                  <p className="text-[10px] text-slate-500">Posted {req.createdAt}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold ${
                      req.status === 'open'
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {req.status === 'open' ? 'Open for Vendors' : 'Assigned'}
                  </span>

                  {currentUser?.role === 'vendor' ? (
                    <button
                      onClick={onNavigateToVendorDashboard}
                      className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium cursor-pointer"
                    >
                      Accept Job
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Booking Service Modal */}
      {bookingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0B1222] border border-cyan-500/40 p-6 shadow-2xl relative">
            <button
              onClick={() => setBookingVendor(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300 text-sm">
                {bookingVendor.avatar}
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Book {bookingVendor.name}</h3>
                <p className="text-xs text-cyan-400">{bookingVendor.category} • Starts at {bookingVendor.startingPrice}</p>
              </div>
            </div>

            {bookingSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-emerald-300 mb-1">Booking Confirmed!</p>
                  <p>{bookingSuccessMsg}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Service Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Time Slot</label>
                    <select
                      value={bookingSlot}
                      onChange={(e) => setBookingSlot(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option>Morning (9 AM - 12 PM)</option>
                      <option>Afternoon (1 PM - 4 PM)</option>
                      <option>Evening (5 PM - 8 PM)</option>
                      <option>Emergency Dispatch (Immediate)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Apartment Block</label>
                    <input
                      type="text"
                      value={bookingBlock}
                      onChange={(e) => setBookingBlock(e.target.value)}
                      placeholder="e.g. Tower B"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Unit Number</label>
                    <input
                      type="text"
                      value={bookingUnit}
                      onChange={(e) => setBookingUnit(e.target.value)}
                      placeholder="e.g. 402"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Problem / Work Notes</label>
                  <textarea
                    rows={2}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Briefly describe what needs fixing..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Security Gate Pass will be automatically dispatched to Main Gate Security.</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-cyan-950"
                >
                  Confirm Appointment & Gate Pass
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Post Service Request Modal */}
      {isPostRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0B1222] border border-cyan-500/40 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsPostRequestModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-white mb-1">Post Society Service Need</h3>
            <p className="text-xs text-slate-400 mb-4">
              Broadcast your maintenance or product requirement to verified campus vendors.
            </p>

            <form onSubmit={handlePostRequest} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Service Category</label>
                <select
                  value={newReqCategory}
                  onChange={(e) => setNewReqCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option>Electrical</option>
                  <option>Plumbing</option>
                  <option>Housekeeping</option>
                  <option>AC & Appliances</option>
                  <option>Carpentry</option>
                  <option>Laundry</option>
                  <option>Groceries</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Work Description</label>
                <textarea
                  rows={3}
                  value={newReqDesc}
                  onChange={(e) => setNewReqDesc(e.target.value)}
                  placeholder="Describe the issue, preferred time, or details..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Block</label>
                  <input
                    type="text"
                    value={newReqBlock}
                    onChange={(e) => setNewReqBlock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newReqUnit}
                    onChange={(e) => setNewReqUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Urgency</label>
                  <select
                    value={newReqUrgency}
                    onChange={(e) => setNewReqUrgency(e.target.value as any)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="standard">Standard</option>
                    <option value="urgent">Urgent</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-cyan-950"
              >
                Publish to Society Board
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
