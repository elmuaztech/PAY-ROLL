import React, { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatutoryWarningBanner } from '../components/common/StatutoryWarningBanner';
import { usePayroll } from '../context/PayrollContext';
import {
  Building2,
  Briefcase,
  Sliders,
  Plus,
  Trash2,
  Edit,
  Save,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Store,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

export const Settings: React.FC = () => {
  const {
    departments,
    positions,
    statutorySettings,
    updateStatutorySetting,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addPosition,
    updatePosition,
    deletePosition,
    refreshAllData,
    apiError
  } = usePayroll();

  const [activeTab, setActiveTab] = useState<'profile' | 'departments' | 'positions' | 'statutory'>('profile');

  // Restaurant Profile State
  const [restaurantName, setRestaurantName] = useState('Maiduguri Restaurant');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [restaurantPhone, setRestaurantPhone] = useState('');
  const [restaurantEmail, setRestaurantEmail] = useState('');

  // Department Modal State
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptError, setDeptError] = useState<string | null>(null);
  const [deptLoading, setDeptLoading] = useState(false);

  // Position Modal State
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [posTitle, setPosTitle] = useState('');
  const [posDeptId, setPosDeptId] = useState('');
  const [posGradeLevel, setPosGradeLevel] = useState('');
  const [posDesc, setPosDesc] = useState('');
  const [posError, setPosError] = useState<string | null>(null);
  const [posLoading, setPosLoading] = useState(false);

  // Action Success Toast
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Profile Form Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Restaurant Organization Profile saved successfully.');
  };

  // Department Form Handlers
  const handleOpenAddDept = () => {
    setEditingDeptId(null);
    setDeptCode('');
    setDeptName('');
    setDeptDesc('');
    setDeptError(null);
    setDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: any) => {
    setEditingDeptId(dept.id);
    setDeptCode(dept.code);
    setDeptName(dept.name);
    setDeptDesc(dept.description || '');
    setDeptError(null);
    setDeptModalOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) {
      setDeptError('Department code and name are required.');
      return;
    }
    setDeptLoading(true);
    setDeptError(null);
    try {
      if (editingDeptId) {
        await updateDepartment(editingDeptId, { code: deptCode, name: deptName, description: deptDesc });
        showToast('Department updated successfully');
      } else {
        await addDepartment({ code: deptCode, name: deptName, description: deptDesc });
        showToast('Department created successfully');
      }
      setDeptModalOpen(false);
    } catch (err: any) {
      setDeptError(err?.message || 'Failed to save department');
    } finally {
      setDeptLoading(false);
    }
  };

  const handleDeleteDept = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete department '${name}'?`)) {
      try {
        await deleteDepartment(id);
        showToast(`Department '${name}' deleted successfully.`);
      } catch (err: any) {
        alert(err?.message || 'Failed to delete department');
      }
    }
  };

  // Position Form Handlers
  const handleOpenAddPos = () => {
    setEditingPosId(null);
    setPosTitle('');
    setPosDeptId(departments[0]?.id || '');
    setPosGradeLevel('Level 05');
    setPosDesc('');
    setPosError(null);
    setPosModalOpen(true);
  };

  const handleOpenEditPos = (pos: any) => {
    setEditingPosId(pos.id);
    setPosTitle(pos.title);
    setPosDeptId(pos.departmentId || '');
    setPosGradeLevel(pos.gradeLevel || '');
    setPosDesc(pos.description || '');
    setPosError(null);
    setPosModalOpen(true);
  };

  const handleSavePos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posTitle.trim()) {
      setPosError('Position title is required.');
      return;
    }
    setPosLoading(true);
    setPosError(null);
    try {
      if (editingPosId) {
        await updatePosition(editingPosId, {
          title: posTitle,
          departmentId: posDeptId || undefined,
          gradeLevel: posGradeLevel,
          description: posDesc
        });
        showToast('Position updated successfully');
      } else {
        await addPosition({
          title: posTitle,
          departmentId: posDeptId || undefined,
          gradeLevel: posGradeLevel,
          description: posDesc
        });
        showToast('Position created successfully');
      }
      setPosModalOpen(false);
    } catch (err: any) {
      setPosError(err?.message || 'Failed to save position');
    } finally {
      setPosLoading(false);
    }
  };

  const handleDeletePos = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete position '${title}'?`)) {
      try {
        await deletePosition(id);
        showToast(`Position '${title}' deleted successfully.`);
      } catch (err: any) {
        alert(err?.message || 'Failed to delete position');
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings & Organization Profile"
        subtitle="Manage restaurant departments, staff positions, and statutory rate placeholders"
        breadcrumb="Administration / Settings"
        actions={
          <button
            onClick={refreshAllData}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
        }
      />

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {apiError}
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Store className="w-4 h-4" /> Organization Profile
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'departments'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" /> Departments ({departments.length})
        </button>

        <button
          onClick={() => setActiveTab('positions')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'positions'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Positions & Roles ({positions.length})
        </button>

        <button
          onClick={() => setActiveTab('statutory')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'statutory'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sliders className="w-4 h-4" /> Statutory Rates
        </button>
      </div>

      {/* TAB 0: ORGANIZATION PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Restaurant Organization Profile</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official identity and contact information for Maiduguri Restaurant.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Organization / Restaurant Name</label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={e => setRestaurantName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Physical Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Maiduguri, Borno State, Nigeria"
                  value={restaurantAddress}
                  onChange={e => setRestaurantAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="+234 800 000 0000"
                    value={restaurantPhone}
                    onChange={e => setRestaurantPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="info@maidugurirestaurant.com"
                    value={restaurantEmail}
                    onChange={e => setRestaurantEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Profile Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 1: DEPARTMENTS MANAGEMENT */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Restaurant Departments</h3>
              <p className="text-xs text-slate-500">
                Departments structure restaurant divisions such as Kitchen, Service, Cashier, Administration, and Maintenance.
              </p>
            </div>
            <button
              onClick={handleOpenAddDept}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Department
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[11px] text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">Department Name</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No departments registered in the database yet. Click "Add Department" to create one.
                    </td>
                  </tr>
                ) : (
                  departments.map(dept => (
                    <tr key={dept.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-bold text-brand-700">{dept.code}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{dept.name}</td>
                      <td className="px-6 py-4 text-slate-500">{dept.description || 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditDept(dept)}
                            className="p-1.5 text-slate-500 hover:text-brand-600 rounded-lg hover:bg-slate-100"
                            title="Edit Department"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDept(dept.id, dept.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Delete Department (Blocked if in use)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: POSITIONS MANAGEMENT */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Positions & Roles</h3>
              <p className="text-xs text-slate-500">
                Positions define staff designations and restaurant salary grade levels.
              </p>
            </div>
            <button
              onClick={handleOpenAddPos}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Position
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[11px] text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Position Title</th>
                  <th className="px-6 py-3.5">Grade Level</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No positions registered in the database yet. Click "Add Position" to create one.
                    </td>
                  </tr>
                ) : (
                  positions.map(pos => {
                    const deptObj = departments.find(d => d.id === pos.departmentId);
                    return (
                      <tr key={pos.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900">{pos.title}</td>
                        <td className="px-6 py-4 font-mono font-semibold text-slate-700">{pos.gradeLevel}</td>
                        <td className="px-6 py-4 text-slate-600">{deptObj ? deptObj.name : 'General'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditPos(pos)}
                              className="p-1.5 text-slate-500 hover:text-brand-600 rounded-lg hover:bg-slate-100"
                              title="Edit Position"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePos(pos.id, pos.title)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="Delete Position (Blocked if assigned)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STATUTORY RATES CONFIGURATION */}
      {activeTab === 'statutory' && (
        <div className="space-y-6">
          <StatutoryWarningBanner />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statutorySettings.map(stat => (
              <div key={stat.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{stat.label}</h4>
                    <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {stat.status}
                  </span>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Configuration Value ({stat.type === 'Percentage' ? '%' : '₦'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={stat.value}
                    onChange={e => updateStatutorySetting(stat.id, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-bold"
                  />
                </div>

                <p className="text-[11px] text-slate-400 italic">{stat.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DEPARTMENT MODAL */}
      {deptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingDeptId ? 'Edit Department' : 'Create New Department'}
              </h3>
              <button onClick={() => setDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {deptError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800">
                {deptError}
              </div>
            )}

            <form onSubmit={handleSaveDept} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Code *</label>
                <input
                  type="text"
                  placeholder="e.g. KITCH, SERV, ADM"
                  value={deptCode}
                  onChange={e => setDeptCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg uppercase font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Kitchen Operations"
                  value={deptName}
                  onChange={e => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of department scope..."
                  value={deptDesc}
                  onChange={e => setDeptDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deptLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs"
                >
                  {deptLoading ? 'Saving...' : editingDeptId ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POSITION MODAL */}
      {posModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingPosId ? 'Edit Position' : 'Create New Position'}
              </h3>
              <button onClick={() => setPosModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {posError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800">
                {posError}
              </div>
            )}

            <form onSubmit={handleSavePos} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Position Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Head Chef, Supervisor, Cashier"
                  value={posTitle}
                  onChange={e => setPosTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Department</label>
                <select
                  value={posDeptId}
                  onChange={e => setPosDeptId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">General / All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Level / Salary Band</label>
                <input
                  type="text"
                  placeholder="e.g. Level 05, Senior Staff"
                  value={posGradeLevel}
                  onChange={e => setPosGradeLevel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Brief position description..."
                  value={posDesc}
                  onChange={e => setPosDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPosModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs"
                >
                  {posLoading ? 'Saving...' : editingPosId ? 'Update Position' : 'Create Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
