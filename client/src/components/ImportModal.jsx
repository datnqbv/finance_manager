import { useState, useRef } from 'react';
import { FiUpload, FiDownload, FiX, FiCheckCircle, FiAlertTriangle, FiFile } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';

const ImportModal = ({ isOpen, onClose, onImported }) => {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { imported, skipped, skippedDetails }
  const inputRef = useRef();

  if (!isOpen) return null;

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setLoading(false);
    onClose();
  };

  const handleFileSelect = (selected) => {
    if (!selected) return;
    const ext = selected.name.split('.').pop().toLowerCase();
    if (!['csv', 'xls', 'xlsx'].includes(ext)) {
      toast.error('Chỉ hỗ trợ file .csv, .xls, .xlsx');
      return;
    }
    setFile(selected);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/import/transactions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data.data);
      if (response.data.data.imported > 0) {
        toast.success(`Import thành công ${response.data.data.imported} giao dịch!`);
        onImported?.();
      } else {
        toast.warning('Không có giao dịch nào được import.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Import thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/import/template', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'import_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Không thể tải template');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import giao dịch</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Nhập giao dịch từ file CSV hoặc Excel</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <FiX size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Download template */}
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5">
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">File mẫu</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Tải về template để biết định dạng chuẩn
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <FiDownload size={14} /> Tải mẫu
            </button>
          </div>

          {/* Format guide */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3.5 text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Định dạng cột:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">date</code> — ngày (2024-01-15)</span>
              <span><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">type</code> — thu / chi</span>
              <span><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">amount</code> — số tiền</span>
              <span><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">category</code> — danh mục</span>
              <span><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">note</code> — ghi chú (tùy chọn)</span>
            </div>
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : file
                  ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FiFile size={32} className="text-green-500" />
                  <p className="font-semibold text-green-700 dark:text-green-400">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB — bấm để đổi file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                  <FiUpload size={32} />
                  <p className="font-medium">Kéo thả file vào đây hoặc bấm để chọn</p>
                  <p className="text-xs">Hỗ trợ: .csv, .xls, .xlsx (tối đa 5 MB)</p>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                  <FiCheckCircle size={24} className="text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">{result.imported}</p>
                    <p className="text-xs text-green-600 dark:text-green-500">Đã import</p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 rounded-xl p-3 border ${
                  result.skipped > 0
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                  <FiAlertTriangle size={24} className={result.skipped > 0 ? 'text-yellow-500 flex-shrink-0' : 'text-gray-400 flex-shrink-0'} />
                  <div>
                    <p className={`text-2xl font-bold ${result.skipped > 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-300'}`}>{result.skipped}</p>
                    <p className={`text-xs ${result.skipped > 0 ? 'text-yellow-600 dark:text-yellow-500' : 'text-gray-500'}`}>Bỏ qua</p>
                  </div>
                </div>
              </div>

              {/* Skipped details */}
              {result.skippedDetails?.length > 0 && (
                <details className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                  <summary className="p-3 cursor-pointer text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                    Xem chi tiết các dòng lỗi ({result.skippedDetails.length})
                  </summary>
                  <div className="px-3 pb-3 space-y-1.5 max-h-40 overflow-y-auto">
                    {result.skippedDetails.map((item, idx) => (
                      <div key={idx} className="text-xs text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2">
                        <span className="font-semibold">Dòng {item.row}:</span> {item.reason}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Import another */}
              <button
                onClick={() => { setFile(null); setResult(null); }}
                className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Import thêm file khác
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="flex gap-3 p-5 pt-0">
            <button onClick={handleClose} className="flex-1 btn btn-secondary">
              Hủy
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="flex-1 btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <FiUpload size={16} /> Import
                </>
              )}
            </button>
          </div>
        )}
        {result && (
          <div className="p-5 pt-0">
            <button onClick={handleClose} className="w-full btn btn-primary">
              Xong
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;
