import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Convert Vietnamese characters to basic ASCII for PDF compatibility
const convertVietnameseToAscii = (text) => {
  if (!text) return text;
  
  const map = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
    'Đ': 'D'
  };
  
  return text.replace(/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/g, function(char) {
    return map[char] || char;
  });
};

// Format currency for display
const formatCurrency = (amount, currency = 'VND') => {
  return new Intl.NumberFormat('vi-VN', { // Vietnamese locale
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format date for display
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Export transactions to PDF
export const exportToPDF = (transactions, user) => {
  const doc = new jsPDF();
  
  // Add title (convert Vietnamese to ASCII)
  doc.setFontSize(20);
  doc.text(convertVietnameseToAscii('Bao Cao Giao Dich'), 14, 20);
  
  // Add user info and date
  doc.setFontSize(10);
  doc.text(convertVietnameseToAscii(`Nguoi dung: ${user?.name || 'N/A'}`), 14, 30);
  doc.text(convertVietnameseToAscii(`Ngay xuat: ${formatDate(new Date())}`), 14, 35);
  doc.text(convertVietnameseToAscii(`Tong so giao dich: ${transactions.length}`), 14, 40);
  
  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;
  
  // Add totals
  doc.text(convertVietnameseToAscii(`Tong thu: ${formatCurrency(totalIncome, user?.currency)}`), 14, 45);
  doc.text(convertVietnameseToAscii(`Tong chi: ${formatCurrency(totalExpense, user?.currency)}`), 14, 50);
  doc.text(convertVietnameseToAscii(`So du: ${formatCurrency(balance, user?.currency)}`), 14, 55);
  
  // Prepare table data (convert Vietnamese text)
  const tableData = transactions.map(t => [
    formatDate(t.date),
    convertVietnameseToAscii(t.type === 'income' ? 'Thu nhap' : 'Chi tieu'),
    convertVietnameseToAscii(t.category),
    formatCurrency(t.amount, user?.currency),
    convertVietnameseToAscii(t.note) || '-'
  ]);
  
  // Add table
  autoTable(doc, {
    startY: 65,
    head: [[
      convertVietnameseToAscii('Ngay'), 
      convertVietnameseToAscii('Loai'), 
      convertVietnameseToAscii('Danh muc'), 
      convertVietnameseToAscii('So tien'), 
      convertVietnameseToAscii('Ghi chu')
    ]],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [14, 165, 233] }, // primary color
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 65 }
  });
  
  // Save the PDF
  doc.save(`bao-cao-giao-dich-${new Date().getTime()}.pdf`);
};

// Export transactions to Excel
export const exportToExcel = (transactions, user) => {
  // Prepare data
  const data = transactions.map(t => ({
    'Ngày': formatDate(t.date),
    'Loại': t.type === 'income' ? 'Thu nhập' : 'Chi tiêu',
    'Danh mục': t.category,
    'Số tiền': t.amount,
    'Số tiền (Formatted)': formatCurrency(t.amount, user?.currency),
    'Ghi chú': t.note || '-',
    'Ngày tạo': formatDate(t.createdAt)
  }));
  
  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;
  
  // Add summary rows
  data.push({});
  data.push({
    'Ngày': 'TỔNG KẾT',
    'Loại': '',
    'Danh mục': '',
    'Số tiền': '',
    'Số tiền (Formatted)': '',
    'Ghi chú': '',
    'Ngày tạo': ''
  });
  data.push({
    'Ngày': 'Tổng thu nhập',
    'Loại': '',
    'Danh mục': '',
    'Số tiền': totalIncome,
    'Số tiền (Formatted)': formatCurrency(totalIncome, user?.currency),
    'Ghi chú': '',
    'Ngày tạo': ''
  });
  data.push({
    'Ngày': 'Tổng chi tiêu',
    'Loại': '',
    'Danh mục': '',
    'Số tiền': totalExpense,
    'Số tiền (Formatted)': formatCurrency(totalExpense, user?.currency),
    'Ghi chú': '',
    'Ngày tạo': ''
  });
  data.push({
    'Ngày': 'Số dư',
    'Loại': '',
    'Danh mục': '',
    'Số tiền': balance,
    'Số tiền (Formatted)': formatCurrency(balance, user?.currency),
    'Ghi chú': '',
    'Ngày tạo': ''
  });
  
  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Ngày
    { wch: 10 }, // Loại
    { wch: 15 }, // Danh mục
    { wch: 12 }, // Số tiền
    { wch: 18 }, // Số tiền (Formatted)
    { wch: 30 }, // Ghi chú
    { wch: 12 }  // Ngày tạo
  ];
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Giao dịch');
  
  // Add info sheet
  const infoData = [
    { 'Thông tin': 'Người dùng', 'Giá trị': user?.name || 'N/A' },
    { 'Thông tin': 'Ngày xuất', 'Giá trị': formatDate(new Date()) },
    { 'Thông tin': 'Tổng giao dịch', 'Giá trị': transactions.length },
    { 'Thông tin': 'Đơn vị tiền tệ', 'Giá trị': user?.currency || 'VND' }
  ];
  const wsInfo = XLSX.utils.json_to_sheet(infoData);
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Thông tin');
  
  // Save the file
  XLSX.writeFile(wb, `giao-dich-${new Date().getTime()}.xlsx`);
};

// Export statistics to PDF
export const exportStatsToPDF = (stats, user) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(convertVietnameseToAscii('Bao Cao Thong Ke'), 14, 20);
  
  // Add user info and date
  doc.setFontSize(10);
  doc.text(convertVietnameseToAscii(`Nguoi dung: ${user?.name || 'N/A'}`), 14, 30);
  doc.text(convertVietnameseToAscii(`Ngay xuat: ${formatDate(new Date())}`), 14, 35);
  
  // Add summary if available
  if (stats.summary) {
    doc.setFontSize(14);
    doc.text(convertVietnameseToAscii('Tong quan'), 14, 50);
    doc.setFontSize(10);
    
    doc.text(convertVietnameseToAscii(`Tong thu: ${formatCurrency(stats.summary.totalIncome, user?.currency)}`), 14, 60);
    doc.text(convertVietnameseToAscii(`Tong chi: ${formatCurrency(stats.summary.totalExpense, user?.currency)}`), 14, 65);
    doc.text(convertVietnameseToAscii(`So du: ${formatCurrency(stats.summary.balance, user?.currency)}`), 14, 70);
  }
  
  // Add category stats if available
  if (stats.categoryStats && stats.categoryStats.length > 0) {
    const tableData = stats.categoryStats.map(cat => [
      convertVietnameseToAscii(cat.category),
      convertVietnameseToAscii(cat.type === 'income' ? 'Thu nhap' : 'Chi tieu'),
      formatCurrency(cat.total, user?.currency),
      cat.count
    ]);
    
    autoTable(doc, {
      startY: 85,
      head: [[
        convertVietnameseToAscii('Danh muc'), 
        convertVietnameseToAscii('Loai'), 
        convertVietnameseToAscii('Tong tien'), 
        convertVietnameseToAscii('So giao dich')
      ]],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [14, 165, 233] },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });
  }
  
  // Save the PDF
  doc.save(`bao-cao-thong-ke-${new Date().getTime()}.pdf`);
};
