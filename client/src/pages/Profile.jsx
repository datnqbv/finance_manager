import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  FiUser, FiMail, FiDollarSign, FiCamera, FiLock,
  FiEye, FiEyeOff, FiSave, FiShield
} from 'react-icons/fi';

// ── Input component ────────────────────────────────────────────────────────
const Field = ({ label, children, hint }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
      {label}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
  </div>
);

const TextInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>}
    <input
      {...props}
      className={`w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${Icon ? 'pl-9 pr-4 py-2.5' : 'px-4 py-2.5'} disabled:opacity-50 disabled:cursor-not-allowed`}
    />
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────
const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();

  // ── Profile form state
  const [profileForm, setProfileForm] = useState({
    name:     user?.name     || '',
    budget:   user?.budget   || 0,
    currency: user?.currency || 'VND',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarFile, setAvatarFile]       = useState(null);

  // ── Password form state
  const [pwForm, setPwForm]     = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [showPw, setShowPw]     = useState({ current: false, next: false, confirm: false });

  const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: user?.currency || 'VND' }).format(n || 0);

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  // ── Avatar handler
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh không được vượt quá 5MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file hình ảnh'); return; }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 400;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
        else       { if (h > MAX) { w = w * MAX / h; h = MAX; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setAvatarPreview(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // ── Save profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    const payload = { ...profileForm, budget: parseFloat(profileForm.budget) };
    if (avatarFile) payload.avatar = avatarPreview;
    await updateProfile(payload);
    setAvatarFile(null);
    setSavingProfile(false);
  };

  // ── Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (pwForm.next.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    setSavingPw(true);
    const result = await changePassword(pwForm.current, pwForm.next);
    if (result.success) setPwForm({ current: '', next: '', confirm: '' });
    setSavingPw(false);
  };

  const togglePw = (field) => setShowPw(prev => ({ ...prev, [field]: !prev[field] }));

  // ── Password field helper
  const PwInput = ({ field, placeholder }) => (
    <div className="relative">
      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
      <input
        type={showPw[field] ? 'text' : 'password'}
        value={pwForm[field]}
        onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
        placeholder={placeholder}
        required
        className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition pl-9 pr-10 py-2.5"
      />
      <button type="button" onClick={() => togglePw(field)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
        {showPw[field] ? <FiEyeOff size={14}/> : <FiEye size={14}/>}
      </button>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <FiUser className="text-gray-500 dark:text-gray-400" size={20}/>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tài khoản</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left: Avatar + Info ── */}
        <div className="space-y-4">

          {/* Avatar card */}
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5 flex flex-col items-center text-center">
            <div className="relative mb-4">
              {avatarPreview ? (
                <img src={avatarPreview} alt={user?.name}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-emerald-500/30"/>
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-emerald-500/30">
                  <span className="text-white text-2xl font-black">{initials}</span>
                </div>
              )}
              <label htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#333333] rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors shadow-sm">
                <FiCamera size={13} className="text-gray-600 dark:text-gray-300"/>
              </label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden"/>
            </div>

            <h2 className="text-base font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{user?.email}</p>

            {avatarFile && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">
                Ảnh mới chờ lưu
              </p>
            )}

            <div className="w-full mt-4 pt-4 border-t border-gray-100 dark:border-[#222222] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 dark:text-gray-500">Ngân sách/tháng</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(user?.budget)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 dark:text-gray-500">Đơn vị tiền tệ</span>
                <span className="font-bold text-gray-700 dark:text-gray-200">{user?.currency || 'VND'}</span>
              </div>
            </div>
          </div>

          {/* Quick info */}
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-blue-500"/>
              <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Thông tin tài khoản</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <FiMail size={12}/>
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <FiShield size={12}/>
                <span>Tài khoản đã xác thực</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Forms ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Edit profile form */}
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-4 rounded-full bg-emerald-500"/>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Chỉnh sửa thông tin</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Field label="Họ và tên">
                <TextInput
                  icon={FiUser}
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="Nguyễn Văn A"
                />
              </Field>

              <Field label="Email" hint="Email không thể thay đổi">
                <TextInput icon={FiMail} type="email" value={user?.email} disabled/>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ngân sách hàng tháng" hint="Giới hạn chi tiêu tháng">
                  <TextInput
                    icon={FiDollarSign}
                    type="number"
                    name="budget"
                    value={profileForm.budget}
                    onChange={e => setProfileForm(p => ({ ...p, budget: e.target.value }))}
                    min="0"
                    step="100000"
                    placeholder="0"
                  />
                </Field>

                <Field label="Đơn vị tiền tệ">
                  <select
                    value={profileForm.currency}
                    onChange={e => setProfileForm(p => ({ ...p, currency: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                    <option value="VND">Việt Nam Đồng (₫)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </Field>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={savingProfile}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  <FiSave size={14}/>
                  {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>

          {/* Change password form */}
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-4 rounded-full bg-purple-500"/>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Đổi mật khẩu</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Field label="Mật khẩu hiện tại">
                <PwInput field="current" placeholder="Nhập mật khẩu hiện tại"/>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Mật khẩu mới" hint="Tối thiểu 6 ký tự">
                  <PwInput field="next" placeholder="Mật khẩu mới"/>
                </Field>
                <Field label="Xác nhận mật khẩu mới">
                  <PwInput field="confirm" placeholder="Nhập lại mật khẩu mới"/>
                </Field>
              </div>

              {pwForm.confirm && (
                <p className={`text-xs font-medium ${
                  pwForm.next === pwForm.confirm
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-500'
                }`}>
                  {pwForm.next === pwForm.confirm ? '✓ Mật khẩu khớp' : '✗ Mật khẩu không khớp'}
                </p>
              )}

              <div className="pt-2">
                <button type="submit"
                  disabled={savingPw || !pwForm.current || !pwForm.next || !pwForm.confirm}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  <FiLock size={14}/>
                  {savingPw ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
