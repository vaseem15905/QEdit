'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  LogOut, Shield, Users, UserCheck, UserX, Plus,
  RefreshCw, Clock, CheckCircle, XCircle, Trash2, Database, Settings, BookOpen, LayoutDashboard, Search, ChevronRight, Mail
} from 'lucide-react';

interface AdminClientProps {
  user: { email: string; name: string };
  role?: 'none' | 'admin' | 'superadmin';
}

interface AuthUser {
  id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected' | 'admin' | 'superadmin';
  approved_by: string | null;
  created_at: string;
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: '#d97706', bg: '#fff8e1',  border: '#fde68a',  icon: Clock },
  approved: { label: 'Approved', color: '#2a7d5f', bg: '#e8f5ee',  border: '#c4e5d3',  icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2',  border: '#fecaca',  icon: XCircle },
  admin:    { label: 'Admin',    color: '#6366f1', bg: '#e0e7ff',  border: '#c7d2fe',  icon: Shield },
  superadmin: { label: 'Super Admin', color: '#111827', bg: '#f3f4f6',  border: '#e5e7eb',  icon: Shield },
};

export default function AdminClient({ user, role = 'admin' }: AdminClientProps) {
  const supabase = createClient();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'users' | 'mcq' | 'settings' | 'inquiries'>('users');
  const [userFilter, setUserFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'admin'>('pending');
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState('');
  const [addingEmail, setAddingEmail] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  const [fetchError, setFetchError] = useState<string | null>(null);

  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [inquiriesError, setInquiriesError] = useState('');

  const fetchInquiries = async () => {
    setLoadingInquiries(true);
    setInquiriesError('');
    try {
      const res = await fetch('/api/admin/inquiries');
      const data = await res.json();
      if (res.ok) setInquiries(data.inquiries || []);
      else setInquiriesError(data.error || 'Failed to load inquiries');
    } catch {
      setInquiriesError('Network error loading inquiries');
    } finally {
      setLoadingInquiries(false);
    }
  };

  useEffect(() => { 
    if (activeTab === 'inquiries') fetchInquiries();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setFetchError(data.error || 'Failed to load users');
      }
    } catch {
      setFetchError('Network error loading users');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const updateStatus = async (id: string, status: AuthUser['status']) => {
    setActionLoading(id + status);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this user from the system?')) return;
    setActionLoading(id + 'delete');
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== id));
    setActionLoading(null);
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(''); setAddSuccess('');
    if (!addEmail.trim()) return;
    setAddingEmail(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: addEmail.trim().toLowerCase() }),
    });
    const data = await res.json();
    setAddingEmail(false);
    if (res.ok) {
      setAddSuccess(`${addEmail.trim()} added as approved.`);
      setAddEmail('');
      fetchUsers();
    } else {
      setAddError(data.error || 'Failed to add email.');
    }
  };

  const standardUsers = users.filter(u => u.status !== 'superadmin');
  const superAdmins = users.filter(u => u.status === 'superadmin');

  const filteredUsers = standardUsers.filter(u =>
    userFilter === 'all' ? true : u.status === userFilter
  );

  const counts = {
    pending: standardUsers.filter(u => u.status === 'pending').length,
    approved: standardUsers.filter(u => u.status === 'approved').length,
    rejected: standardUsers.filter(u => u.status === 'rejected').length,
    admin: standardUsers.filter(u => u.status === 'admin').length,
  };

  return (
    <div className="min-h-screen flex w-full" style={{ background: 'linear-gradient(180deg, #f0f7f4 0%, #f8f9fb 100%)' }}>
      
      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-64 shrink-0 flex flex-col z-30" style={{ background: '#ffffff', borderRight: '1px solid #e2e5ea', boxShadow: '0 0 20px rgba(0,0,0,0.02)' }}>
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <Image src="/logo.png" alt="QEdit" width={120} height={32} className="h-8 w-auto" priority />
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest"
              style={{ background: '#e8f5ee', color: '#2a7d5f', border: '1px solid #c4e5d3' }}>
              <Shield size={10} /> Sys-Ops
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Main Menu</div>
          {[
            ['users', Users, 'User Management'],
            ['mcq', BookOpen, 'MCQ Questions'],
            ...(role === 'superadmin' ? [['inquiries', Mail, 'Inquiries']] : []),
            ['settings', Settings, 'System Settings'],
          ].map(([id, Icon, label]) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id as string}
                onClick={() => setActiveTab(id as any)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={isActive 
                  ? { background: 'linear-gradient(135deg, #2a7d5f 0%, #1e6b4f 100%)', color: '#ffffff', boxShadow: '0 4px 12px rgba(42,125,95,0.25)' }
                  : { background: 'transparent', color: '#6b7280' }}
                onMouseEnter={!isActive ? (e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#1a1a2e'; } : undefined}
                onMouseLeave={!isActive ? (e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; } : undefined}
              >
                <Icon size={18} style={{ opacity: isActive ? 1 : 0.7 }} />
                {label as string}
              </button>
            );
          })}
        </nav>

        <div className="p-4 m-4 rounded-2xl" style={{ background: '#fafbfc', border: '1px solid #e9ecef' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #2a7d5f, #1e6b4f)', boxShadow: '0 2px 8px rgba(42,125,95,0.3)' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-[11px] font-medium text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-x-hidden flex flex-col relative z-10">
        
        {/* Header */}
        <header className="px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 z-20 backdrop-blur-md" 
                style={{ background: 'rgba(240, 247, 244, 0.85)', borderBottom: '1px solid rgba(226, 229, 234, 0.5)' }}>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {activeTab === 'users' ? 'User Management' : activeTab === 'mcq' ? 'MCQ Questions' : 'System Settings'}
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Sys-Ops administrative center</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 bg-white"
              style={{ color: '#4b5563', border: '1px solid #e2e5ea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2a7d5f'; e.currentTarget.style.color = '#2a7d5f'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e5ea'; e.currentTarget.style.color = '#4b5563'; }}>
              <LayoutDashboard size={16} /> Exit to Dashboard
            </button>
          </div>
        </header>

        <div className="px-10 py-8 flex-1 max-w-6xl">
          
          {/* ── USER MANAGEMENT TAB ── */}
          {activeTab === 'users' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Stats & Pre-Approve Row */}
              <div className="flex flex-col xl:flex-row gap-6">
                
                {/* Stats row */}
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-2 gap-4">
                  {(['pending', 'approved', 'admin', 'rejected'] as const).map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    const Icon = cfg.icon;
                    return (
                      <div key={s} className="group rounded-2xl p-5 transition-all duration-300 bg-white"
                        style={{ border: '1px solid #e9ecef', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.bg}`; e.currentTarget.style.borderColor = cfg.color; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = '#e9ecef'; }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 group-hover:text-gray-900 transition-colors">{cfg.label}</span>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: cfg.bg, color: cfg.color }}>
                            <Icon size={16} />
                          </div>
                        </div>
                        <p className="text-4xl font-extrabold tracking-tight text-gray-900 transition-colors">{counts[s]}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Add email manually */}
                <div className="xl:w-[400px] rounded-2xl p-6 bg-white" style={{ border: '1px solid #e9ecef', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 rounded bg-green-50 flex items-center justify-center text-[#2a7d5f]"><Plus size={16} /></div>
                    <h2 className="text-sm font-bold text-gray-900">Pre-Approve Email</h2>
                  </div>
                  {addSuccess && (
                    <div className="mb-4 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2" style={{ background: '#e8f5ee', color: '#2a7d5f', border: '1px solid #c4e5d3' }}>
                      <CheckCircle size={14} /> {addSuccess}
                    </div>
                  )}
                  {addError && (
                    <div className="mb-4 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                      <XCircle size={14} /> {addError}
                    </div>
                  )}
                  <form onSubmit={handleAddEmail} className="flex flex-col gap-3">
                    <input
                      type="email" required placeholder="teacher@university.edu"
                      value={addEmail} onChange={(e) => setAddEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 border border-gray-200 focus:bg-white transition-all outline-none text-gray-900"
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#2a7d5f'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(42,125,95,0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    <button type="submit" disabled={addingEmail}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #2a7d5f 0%, #1e6b4f 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(42,125,95,0.2)' }}>
                      {addingEmail ? 'Adding...' : 'Add & Approve User'}
                    </button>
                    <p className="text-[11px] text-gray-400 font-medium text-center mt-1">Pre-approved users instantly access the dashboard upon first login.</p>
                  </form>
                </div>
              </div>

              {/* Data Table Section */}
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e9ecef', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                {/* Table Header / Filters */}
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#fafbfc]">
                  <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200">
                    {(['pending', 'approved', 'rejected', 'admin', 'all'] as const).map((f) => {
                      const isActive = userFilter === f;
                      const count = f !== 'all' ? counts[f] : standardUsers.length;
                      return (
                        <button key={f} onClick={() => setUserFilter(f)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                          style={isActive
                            ? { background: '#2a7d5f', color: '#fff' }
                            : { background: 'transparent', color: '#6b7280' }}>
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                          <span className="px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{ background: isActive ? 'rgba(255,255,255,0.2)' : '#f3f4f6', color: isActive ? '#fff' : '#111827' }}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Search by email..." disabled
                        className="pl-9 pr-4 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:bg-white outline-none w-[200px]" 
                        title="Search coming soon" />
                    </div>
                    <button onClick={fetchUsers} disabled={loadingUsers}
                      className="flex items-center justify-center p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-[#2a7d5f] hover:border-[#2a7d5f] transition-all disabled:opacity-50"
                      title="Refresh Data">
                      <RefreshCw size={16} className={loadingUsers ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {/* Table Content */}
                <div className="min-h-[300px]">
                  {loadingUsers ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                      <RefreshCw size={24} className="animate-spin mb-3 text-[#2a7d5f]" />
                      <p className="text-sm font-medium">Fetching secure records...</p>
                    </div>
                  ) : fetchError ? (
                    <div className="flex flex-col items-center justify-center h-[300px]">
                      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4"><XCircle size={32} /></div>
                      <p className="text-base font-bold text-gray-900 mb-1">Failed to load payload</p>
                      <p className="text-sm text-gray-500 font-medium max-w-md text-center">{fetchError}</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                      <Users size={32} className="mb-3 text-gray-300" />
                      <p className="text-sm font-bold text-gray-500">No {userFilter !== 'all' ? userFilter : ''} users found.</p>
                      <p className="text-xs text-gray-400 mt-1">Adjust filters or pre-approve a new email.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredUsers.map((u) => {
                        const cfg = STATUS_CONFIG[u.status];
                        const StatusIcon = cfg.icon;
                        const isActing = (suf: string) => actionLoading === u.id + suf;
                        return (
                          <div key={u.id} className="group flex items-center justify-between p-4 px-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm"
                                style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#4b5563' }}>
                                {u.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{u.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase"
                                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                    <StatusIcon size={10} /> {cfg.label}
                                  </span>
                                  <span className="text-[11px] font-medium text-gray-400">
                                    Joined {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            </div>
    
                            <div className="flex items-center gap-2 shrink-0 ml-4 opacity-70 group-hover:opacity-100 transition-opacity">
                              {role === 'superadmin' && u.status === 'approved' && (
                                <button onClick={() => updateStatus(u.id, 'admin')}
                                  disabled={!!actionLoading}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 shadow-sm border-dashed">
                                  {isActing('admin') ? <RefreshCw size={12} className="animate-spin" /> : <Shield size={12} />} 
                                  {isActing('admin') ? 'Promoting' : 'Make Admin'}
                                </button>
                              )}
                              {role === 'superadmin' && u.status === 'admin' && (
                                <button onClick={() => updateStatus(u.id, 'approved')}
                                  disabled={!!actionLoading}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 shadow-sm">
                                  {isActing('approved') ? <RefreshCw size={12} className="animate-spin" /> : <UserX size={12} />} 
                                  {isActing('approved') ? 'Processing' : 'Revoke Admin'}
                                </button>
                              )}
                              {u.status !== 'approved' && u.status !== 'admin' && (
                                <button onClick={() => updateStatus(u.id, 'approved')}
                                  disabled={!!actionLoading}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 shadow-sm">
                                  {isActing('approved') ? <RefreshCw size={12} className="animate-spin" /> : <UserCheck size={12} />} 
                                  {isActing('approved') ? 'Processing' : 'Approve'}
                                </button>
                              )}
                              {u.status !== 'rejected' && u.status !== 'admin' && (
                                <button onClick={() => updateStatus(u.id, 'rejected')}
                                  disabled={!!actionLoading}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 shadow-sm">
                                  {isActing('rejected') ? <RefreshCw size={12} className="animate-spin" /> : <UserX size={12} />}
                                  {isActing('rejected') ? 'Processing' : 'Reject'}
                                </button>
                              )}
                              {(u.status !== 'admin' || role === 'superadmin') && (
                                <button onClick={() => handleDelete(u.id)}
                                  disabled={!!actionLoading}
                                  className="p-1.5 px-3 rounded-lg text-xs font-bold transition-all disabled:opacity-40 bg-white border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm"
                                  title="Remove User">
                                  <Trash2 size={14} className="inline-block mr-1" /> Delete
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── SYSTEM SETTINGS (SUPER ADMINS) ── */}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#fafbfc]">
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900">Super Admins</h2>
                    <p className="text-sm text-gray-500 font-medium">Manage root-level delegates for the system.</p>
                  </div>
                  {role === 'superadmin' && (
                    <div className="flex gap-2">
                       <input type="email" placeholder="superadmin@school.edu" 
                         value={addEmail} onChange={(e) => setAddEmail(e.target.value)}
                         className="px-4 py-2 w-[220px] rounded-xl text-sm border border-gray-200 bg-white focus:border-[#2a7d5f] outline-none" 
                       />
                       <button onClick={async (e) => {
                          e.preventDefault();
                          if (!addEmail) return;
                          setAddingEmail(true);
                          const res = await fetch('/api/admin/users', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: addEmail.trim(), status: 'superadmin' }),
                          });
                          setAddingEmail(false);
                          if (res.ok) { setAddEmail(''); fetchUsers(); }
                          else alert('Failed to add super admin.');
                       }} 
                         disabled={addingEmail}
                         className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-[#2a7d5f] text-white hover:bg-[#1f5e47] transition-all disabled:opacity-50 shadow-sm"
                       >
                         {addingEmail ? <RefreshCw size={16} className="animate-spin" /> : <Shield size={16} />} Add
                       </button>
                    </div>
                  )}
                </div>

                <div className="divide-y divide-gray-100">
                  {superAdmins.map((u) => (
                    <div key={u.id} className="group flex items-center justify-between p-4 px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-gray-900 text-white shadow-sm">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{u.email}</p>
                          <span className="text-[11px] font-medium text-gray-400">
                            Joined {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-4 opacity-70 group-hover:opacity-100 transition-opacity">
                        {role === 'superadmin' && (
                          <button onClick={() => updateStatus(u.id, 'admin')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 shadow-sm">
                            {actionLoading === u.id + 'admin' ? <RefreshCw size={12} className="animate-spin" /> : <UserX size={12} />} 
                            Revoke Root
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {superAdmins.length === 0 && (
                     <div className="p-10 text-center text-sm text-gray-500 font-medium">No secondary super admins assigned.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mcq' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 max-w-4xl">
              <div className="bg-white rounded-2xl p-10 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[#e8f5ee] border-2 border-[#c4e5d3] flex items-center justify-center mb-6">
                  <BookOpen size={36} className="text-[#2a7d5f]" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Module Offline</h2>
                <p className="text-gray-500 font-medium max-w-md">
                  The <span className="font-bold text-[#2a7d5f]">MCQ Questions</span> module is currently disabled in this environment.
                </p>
                <button onClick={() => setActiveTab('users')}
                  className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white border-2 border-[#2a7d5f] text-[#2a7d5f] hover:bg-[#e8f5ee] transition-colors">
                  <ChevronRight size={16} /> Return to User Management
                </button>
              </div>
            </div>
          )}

          {/* ── INQUIRIES (SUPER ADMINS) ── */}
          {activeTab === 'inquiries' && role === 'superadmin' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 max-w-5xl">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#fafbfc]">
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900">Inquiries</h2>
                    <p className="text-sm text-gray-500 font-medium">Messages from the public contact form.</p>
                  </div>
                  <button onClick={fetchInquiries} disabled={loadingInquiries}
                    className="flex items-center justify-center p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-[#2a7d5f] hover:border-[#2a7d5f] transition-all disabled:opacity-50">
                    <RefreshCw size={16} className={loadingInquiries ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="divide-y divide-gray-100 min-h-[300px]">
                  {loadingInquiries ? (
                     <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                       <RefreshCw size={24} className="animate-spin mb-3 text-[#2a7d5f]" />
                       <p className="text-sm font-medium">Fetching secure records...</p>
                     </div>
                  ) : inquiriesError ? (
                     <div className="flex flex-col items-center justify-center h-[300px] text-red-500">
                       <XCircle size={32} className="mb-3" />
                       <p className="text-sm font-bold">{inquiriesError}</p>
                     </div>
                  ) : inquiries.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                       <Mail size={32} className="mb-3 text-gray-300" />
                       <p className="text-sm font-bold text-gray-500">No inquiries found.</p>
                     </div>
                  ) : inquiries.map((inq: any, i: number) => (
                    <div key={inq.id || i} className="group p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-base font-bold text-gray-900">{inq.name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                             <a href={`mailto:${inq.email}`} className="text-[#2a7d5f] font-semibold hover:underline">{inq.email}</a>
                             {inq.organization && (
                               <>
                                 <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                 <span>{inq.organization}</span>
                               </>
                             )}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md">
                          {new Date(inq.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{inq.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
