import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiDollarSign, FiCamera } from 'react-icons/fi';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    budget: user?.budget || 0,
    currency: user?.currency || 'VND',
  });
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh');
        return;
      }

      setAvatarFile(file);

      // Create preview with compression
      const reader = new FileReader();
      reader.onloadend = () => {
        // Compress image if needed
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with quality 0.8
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setAvatarPreview(compressedBase64);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const updateData = {
      ...formData,
      budget: parseFloat(formData.budget),
    };

    // If avatar file is selected, include it
    if (avatarFile) {
      updateData.avatar = avatarPreview;
    }

    await updateProfile(updateData);
    setLoading(false);
    setAvatarFile(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tài khoản</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Quản lý thông tin cá nhân</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <div className="card text-center">
            <div className="relative inline-block mb-4">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt={user?.name}
                  className="w-24 h-24 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 
                              rounded-full flex items-center justify-center shadow-lg">
                  <FiUser size={48} className="text-white" />
                </div>
              )}
              <label 
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-800 
                         rounded-full flex items-center justify-center cursor-pointer
                         shadow-lg border-2 border-gray-200 dark:border-gray-700
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FiCamera size={16} className="text-gray-600 dark:text-gray-300" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{user?.email}</p>
            {avatarFile && (
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-2">
                Ảnh mới sẽ được lưu khi bạn nhấn "Lưu thay đổi"
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Ngân sách hàng tháng</div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: user?.currency || 'VND',
                }).format(user?.budget || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Chỉnh sửa thông tin</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Họ và tên
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input pl-10"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="input pl-10 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Email không thể thay đổi</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngân sách hàng tháng
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    min="0"
                    step="100000"
                    className="input pl-10"
                    placeholder="0"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Đặt giới hạn chi tiêu hàng tháng
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Đơn vị tiền tệ
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="VND">Việt Nam Đồng (₫)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1"
                >
                  {loading ? 'Đang xử lý...' : 'Lưu thay đổi'}
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
