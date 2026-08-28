import React, { useState } from 'react';
import { Employee, EmploymentType, EmployeeStatus } from '../../types';
import { usePayroll } from '../../context/PayrollContext';

interface EmployeeFormProps {
  initialValues?: Partial<Employee>;
  onSubmit: (data: Omit<Employee, 'id' | 'createdAt'>) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const { departments, positions, apiError } = usePayroll();

  const [formData, setFormData] = useState({
    employeeId: initialValues?.employeeId || `MR-STAFF-${Math.floor(1000 + Math.random() * 9000)}`,
    firstName: initialValues?.firstName || '',
    lastName: initialValues?.lastName || '',
    otherName: initialValues?.otherName || '',
    email: initialValues?.email || '',
    phoneNumber: initialValues?.phoneNumber || '',
    department: initialValues?.department || (departments[0]?.name || 'Kitchen Operations'),
    position: initialValues?.position || (positions[0]?.title || 'Staff'),
    employmentType: (initialValues?.employmentType || 'Full-Time') as EmploymentType,
    dateOfEmployment: initialValues?.dateOfEmployment || new Date().toISOString().split('T')[0],
    basicSalary: initialValues?.basicSalary || 150000,
    bankName: initialValues?.bankName || 'First Bank of Nigeria',
    accountNumber: initialValues?.accountNumber || '',
    accountName: initialValues?.accountName || '',
    status: (initialValues?.status || 'Active') as EmployeeStatus
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'basicSalary' ? parseFloat(value) || 0 : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError(null);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.position.trim()) newErrors.position = 'Position / Role is required';
    if (formData.basicSalary <= 0) newErrors.basicSalary = 'Basic salary must be greater than 0';
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Bank account number is required';
    if (formData.accountNumber.trim().length !== 10) newErrors.accountNumber = 'NUBAN account number must be 10 digits';
    if (!formData.accountName.trim()) newErrors.accountName = 'Account name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      setServerError(null);
      try {
        await onSubmit(formData);
      } catch (err: any) {
        setServerError(err?.message || 'Failed to save employee record');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-xs">
      {(serverError || apiError) && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 animate-in fade-in duration-150">
          {serverError || apiError}
        </div>
      )}

      {/* Personal Information */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-600" /> Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee ID *</label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-mono font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Name *</label>
            <input
              type="text"
              name="firstName"
              placeholder="e.g. Aminu"
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-brand-500 ${
                errors.firstName ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
              }`}
            />
            {errors.firstName && <p className="text-xs text-rose-600 mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Name *</label>
            <input
              type="text"
              name="lastName"
              placeholder="e.g. Okonkwo"
              value={formData.lastName}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-brand-500 ${
                errors.lastName ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
              }`}
            />
            {errors.lastName && <p className="text-xs text-rose-600 mt-1">{errors.lastName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Other Name (Optional)</label>
            <input
              type="text"
              name="otherName"
              placeholder="e.g. Babatunde"
              value={formData.otherName}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address *</label>
            <input
              type="email"
              name="email"
              placeholder="e.g. a.okonkwo@maidugurirestaurant.com"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-brand-500 ${
                errors.email ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
              }`}
            />
            {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              placeholder="e.g. +234 803 123 4567"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-brand-500 ${
                errors.phoneNumber ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
              }`}
            />
            {errors.phoneNumber && <p className="text-xs text-rose-600 mt-1">{errors.phoneNumber}</p>}
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-600" /> Employment & Designation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Flexible Department Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department *</label>
            <input
              type="text"
              name="department"
              list="department-suggestions"
              value={formData.department}
              onChange={handleChange}
              placeholder="Type or select department..."
              className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-brand-500 ${
                errors.department ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
              }`}
              required
            />
            <datalist id="department-suggestions">
              {departments.map(d => (
                <option key={d.id} value={d.name} />
              ))}
              <option value="Kitchen Operations" />
              <option value="Service & Dining" />
              <option value="Cashier & Billing" />
              <option value="Administration" />
              <option value="Security & Cleaning" />
            </datalist>
            {errors.department && <p className="text-xs text-rose-600 mt-1">{errors.department}</p>}
          </div>

          {/* Flexible Position / Role Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Position / Role *</label>
            <input
              type="text"
              name="position"
              list="position-suggestions"
              value={formData.position}
              onChange={handleChange}
              placeholder="Type or select position..."
              className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-brand-500 ${
                errors.position ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
              }`}
              required
            />
            <datalist id="position-suggestions">
              {positions.map(p => (
                <option key={p.id} value={p.title} />
              ))}
              <option value="Head Chef" />
              <option value="Sous Chef" />
              <option value="Cook" />
              <option value="Waitstaff / Server" />
              <option value="Cashier" />
              <option value="Supervisor" />
              <option value="Restaurant Manager" />
              <option value="Cleaner / Dishwasher" />
            </datalist>
            {errors.position && <p className="text-xs text-rose-600 mt-1">{errors.position}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employment Type *</label>
            <select
              name="employmentType"
              value={formData.employmentType}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Temporary">Temporary</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date of Employment *</label>
            <input
              type="date"
              name="dateOfEmployment"
              value={formData.dateOfEmployment}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white font-semibold"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Salary & Bank Details */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-600" /> Basic Salary & Bank Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Monthly Basic Salary (₦) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">₦</span>
              <input
                type="number"
                name="basicSalary"
                min="1000"
                step="1000"
                value={formData.basicSalary}
                onChange={handleChange}
                className={`w-full pl-8 pr-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-brand-500 font-semibold ${
                  errors.basicSalary ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
                }`}
              />
            </div>
            {errors.basicSalary && <p className="text-xs text-rose-600 mt-1">{errors.basicSalary}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bank Name *</label>
            <select
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="First Bank of Nigeria">First Bank of Nigeria</option>
              <option value="Zenith Bank">Zenith Bank</option>
              <option value="Guaranty Trust Bank (GTBank)">Guaranty Trust Bank (GTBank)</option>
              <option value="Access Bank">Access Bank</option>
              <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
              <option value="Fidelity Bank">Fidelity Bank</option>
              <option value="Union Bank of Nigeria">Union Bank of Nigeria</option>
              <option value="Stanbic IBTC Bank">Stanbic IBTC Bank</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">NUBAN Account Number (10 digits) *</label>
            <input
              type="text"
              name="accountNumber"
              maxLength={10}
              placeholder="e.g. 0123456789"
              value={formData.accountNumber}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-brand-500 font-mono ${
                errors.accountNumber ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
              }`}
            />
            {errors.accountNumber && <p className="text-xs text-rose-600 mt-1">{errors.accountNumber}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Account Name (as on Bank Records) *</label>
            <input
              type="text"
              name="accountName"
              placeholder="e.g. AMINU OKONKWOBATUNDE"
              value={formData.accountName}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-brand-500 uppercase ${
                errors.accountName ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
              }`}
            />
            {errors.accountName && <p className="text-xs text-rose-600 mt-1">{errors.accountName}</p>}
          </div>
        </div>
      </div>

      {/* Form Buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-slate-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
        >
          {loading || isSubmitting ? 'Saving to Database...' : initialValues ? 'Update Employee Record' : 'Save & Register Employee'}
        </button>
      </div>
    </form>
  );
};
