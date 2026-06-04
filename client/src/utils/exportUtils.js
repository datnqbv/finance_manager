// Format currency for display
const formatCurrency = (amount, currency = 'VND') => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency || 'VND',
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

const getReportTitle = (groupBy) => {
  if (groupBy === 'day') return 'BÁO CÁO GIAO DỊCH THEO NGÀY';
  if (groupBy === 'month') return 'BÁO CÁO GIAO DỊCH THEO THÁNG';
  if (groupBy === 'quarter') return 'BÁO CÁO GIAO DỊCH THEO QUÝ';
  return 'BÁO CÁO CHI TIẾT GIAO DỊCH';
};

// Export transactions to PDF (async due to dynamic imports of heavy libraries)
export const exportToPDF = async (transactions, user, groupBy = 'detail') => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const { robotoBase64 } = await import('./robotoFont');

  const doc = new jsPDF();
  doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.setFont('Roboto');

  const reportTitle = getReportTitle(groupBy);

  // Add title (using full Vietnamese diacritics)
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39); // Gray 900
  doc.text(reportTitle, 14, 20);

  // Add user info and date
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // Gray 500
  doc.text(`Người xuất: ${user?.name || 'N/A'}`, 14, 30);
  doc.text(`Ngày xuất: ${formatDate(new Date())}`, 14, 35);
  doc.text(`Tổng số giao dịch gốc: ${transactions.length}`, 14, 40);

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const balance = totalIncome - totalExpense;

  // Add totals section with color highlights
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129); // Emerald 500
  doc.text(`Tổng thu: ${formatCurrency(totalIncome, user?.currency)}`, 14, 48);
  doc.setTextColor(239, 68, 68); // Red 500
  doc.text(`Tổng chi: ${formatCurrency(totalExpense, user?.currency)}`, 14, 54);

  if (balance >= 0) {
    doc.setTextColor(16, 185, 129);
  } else {
    doc.setTextColor(239, 68, 68);
  }
  doc.text(`Số dư ròng: ${formatCurrency(balance, user?.currency)}`, 14, 60);

  let headers = [];
  let tableData = [];

  if (groupBy === 'detail') {
    headers = [['Ngày', 'Loại', 'Danh mục', 'Số tiền', 'Ghi chú']];
    tableData = transactions.map(t => [
      formatDate(t.date),
      t.type === 'income' ? 'Thu nhập' : (t.type === 'expense' ? 'Chi tiêu' : 'Chuyển khoản'),
      t.category || '-',
      formatCurrency(t.amount, user?.currency),
      t.note || '-'
    ]);
  } else if (groupBy === 'day') {
    headers = [['Ngày', 'Tổng thu nhập', 'Tổng chi tiêu', 'Số dư ròng']];
    const groups = {};
    transactions.forEach(t => {
      const key = formatDate(t.date);
      if (!groups[key]) groups[key] = { key, income: 0, expense: 0 };
      if (t.type === 'income') groups[key].income += (parseFloat(t.amount) || 0);
      if (t.type === 'expense') groups[key].expense += (parseFloat(t.amount) || 0);
    });

    tableData = Object.values(groups)
      .sort((a, b) => new Date(b.key.split('/').reverse().join('-')) - new Date(a.key.split('/').reverse().join('-')))
      .map(g => [
        g.key,
        formatCurrency(g.income, user?.currency),
        formatCurrency(g.expense, user?.currency),
        formatCurrency(g.income - g.expense, user?.currency)
      ]);
  } else if (groupBy === 'month') {
    headers = [['Tháng', 'Tổng thu nhập', 'Tổng chi tiêu', 'Số dư ròng']];
    const groups = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      if (!groups[key]) groups[key] = { key, income: 0, expense: 0, year: d.getFullYear(), month: d.getMonth() };
      if (t.type === 'income') groups[key].income += (parseFloat(t.amount) || 0);
      if (t.type === 'expense') groups[key].expense += (parseFloat(t.amount) || 0);
    });

    tableData = Object.values(groups)
      .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))
      .map(g => [
        g.key,
        formatCurrency(g.income, user?.currency),
        formatCurrency(g.expense, user?.currency),
        formatCurrency(g.income - g.expense, user?.currency)
      ]);
  } else if (groupBy === 'quarter') {
    headers = [['Quý', 'Tổng thu nhập', 'Tổng chi tiêu', 'Số dư ròng']];
    const groups = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const q = Math.floor(d.getMonth() / 3) + 1;
      const key = `Quý ${q}/${d.getFullYear()}`;
      if (!groups[key]) groups[key] = { key, income: 0, expense: 0, year: d.getFullYear(), q };
      if (t.type === 'income') groups[key].income += (parseFloat(t.amount) || 0);
      if (t.type === 'expense') groups[key].expense += (parseFloat(t.amount) || 0);
    });

    tableData = Object.values(groups)
      .sort((a, b) => b.year !== a.year ? b.year - a.year : b.q - a.q)
      .map(g => [
        g.key,
        formatCurrency(g.income, user?.currency),
        formatCurrency(g.expense, user?.currency),
        formatCurrency(g.income - g.expense, user?.currency)
      ]);
  }

  // Add Table
  autoTable(doc, {
    startY: 68,
    head: headers,
    body: tableData,
    styles: { font: 'Roboto', fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' }, // Emerald 500 primary color
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 68 }
  });

  // Save the PDF
  doc.save(`bao-cao-giao-dich-${groupBy}-${new Date().getTime()}.pdf`);
};

// Export transactions to Excel (async due to dynamic import of xlsx)
export const exportToExcel = async (transactions, user, groupBy = 'detail') => {
  const XLSX = await import('xlsx');

  let data = [];

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const balance = totalIncome - totalExpense;

  if (groupBy === 'detail') {
    data = transactions.map(t => ({
      'Ngày': formatDate(t.date),
      'Loại': t.type === 'income' ? 'Thu nhập' : (t.type === 'expense' ? 'Chi tiêu' : 'Chuyển khoản'),
      'Danh mục': t.category || '-',
      'Số tiền': t.amount,
      'Số tiền định dạng': formatCurrency(t.amount, user?.currency),
      'Ghi chú': t.note || '-',
      'Ngày tạo': formatDate(t.createdAt)
    }));
  } else if (groupBy === 'day') {
    const groups = {};
    transactions.forEach(t => {
      const key = formatDate(t.date);
      if (!groups[key]) groups[key] = { key, income: 0, expense: 0 };
      if (t.type === 'income') groups[key].income += (parseFloat(t.amount) || 0);
      if (t.type === 'expense') groups[key].expense += (parseFloat(t.amount) || 0);
    });

    data = Object.values(groups)
      .sort((a, b) => new Date(b.key.split('/').reverse().join('-')) - new Date(a.key.split('/').reverse().join('-')))
      .map(g => ({
        'Ngày': g.key,
        'Tổng thu nhập': g.income,
        'Tổng chi tiêu': g.expense,
        'Số dư ròng': g.income - g.expense,
        'Tổng thu nhập (định dạng)': formatCurrency(g.income, user?.currency),
        'Tổng chi tiêu (định dạng)': formatCurrency(g.expense, user?.currency),
        'Số dư ròng (định dạng)': formatCurrency(g.income - g.expense, user?.currency)
      }));
  } else if (groupBy === 'month') {
    const groups = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      if (!groups[key]) groups[key] = { key, income: 0, expense: 0, year: d.getFullYear(), month: d.getMonth() };
      if (t.type === 'income') groups[key].income += (parseFloat(t.amount) || 0);
      if (t.type === 'expense') groups[key].expense += (parseFloat(t.amount) || 0);
    });

    data = Object.values(groups)
      .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))
      .map(g => ({
        'Tháng': g.key,
        'Tổng thu nhập': g.income,
        'Tổng chi tiêu': g.expense,
        'Số dư ròng': g.income - g.expense,
        'Tổng thu nhập (định dạng)': formatCurrency(g.income, user?.currency),
        'Tổng chi tiêu (định dạng)': formatCurrency(g.expense, user?.currency),
        'Số dư ròng (định dạng)': formatCurrency(g.income - g.expense, user?.currency)
      }));
  } else if (groupBy === 'quarter') {
    const groups = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const q = Math.floor(d.getMonth() / 3) + 1;
      const key = `Quý ${q}/${d.getFullYear()}`;
      if (!groups[key]) groups[key] = { key, income: 0, expense: 0, year: d.getFullYear(), q };
      if (t.type === 'income') groups[key].income += (parseFloat(t.amount) || 0);
      if (t.type === 'expense') groups[key].expense += (parseFloat(t.amount) || 0);
    });

    data = Object.values(groups)
      .sort((a, b) => b.year !== a.year ? b.year - a.year : b.q - a.q)
      .map(g => ({
        'Quý': g.key,
        'Tổng thu nhập': g.income,
        'Tổng chi tiêu': g.expense,
        'Số dư ròng': g.income - g.expense,
        'Tổng thu nhập (định dạng)': formatCurrency(g.income, user?.currency),
        'Tổng chi tiêu (định dạng)': formatCurrency(g.expense, user?.currency),
        'Số dư ròng (định dạng)': formatCurrency(g.income - g.expense, user?.currency)
      }));
  }

  // Add summary rows
  data.push({});
  const timeKey = groupBy === 'detail' ? 'Ngày' : (groupBy === 'day' ? 'Ngày' : (groupBy === 'month' ? 'Tháng' : 'Quý'));

  data.push({
    [timeKey]: 'TỔNG KẾT BÁO CÁO',
    'Loại': '',
    'Danh mục': '',
    'Số tiền': '',
    'Số tiền định dạng': '',
    'Ghi chú': '',
    'Ngày tạo': ''
  });
  data.push({
    [timeKey]: 'Tổng thu nhập',
    'Loại': '',
    'Danh mục': '',
    'Số tiền': totalIncome,
    'Số tiền định dạng': formatCurrency(totalIncome, user?.currency),
    'Ghi chú': '',
    'Ngày tạo': '',
    // also map in case of Daily/Monthly/Quarterly headers
    'Tổng thu nhập': totalIncome,
    'Tổng thu nhập (định dạng)': formatCurrency(totalIncome, user?.currency)
  });
  data.push({
    [timeKey]: 'Tổng chi tiêu',
    'Loại': '',
    'Danh mục': '',
    'Số tiền': totalExpense,
    'Số tiền định dạng': formatCurrency(totalExpense, user?.currency),
    'Ghi chú': '',
    'Ngày tạo': '',
    // also map in case of Daily/Monthly/Quarterly headers
    'Tổng chi tiêu': totalExpense,
    'Tổng chi tiêu (định dạng)': formatCurrency(totalExpense, user?.currency)
  });
  data.push({
    [timeKey]: 'Số dư ròng',
    'Loại': '',
    'Danh mục': '',
    'Số tiền': balance,
    'Số tiền định dạng': formatCurrency(balance, user?.currency),
    'Ghi chú': '',
    'Ngày tạo': '',
    // also map in case of Daily/Monthly/Quarterly headers
    'Số dư ròng': balance,
    'Số dư ròng (định dạng)': formatCurrency(balance, user?.currency)
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // Time
    { wch: 12 }, // Type
    { wch: 18 }, // Category
    { wch: 15 }, // Amount
    { wch: 22 }, // Formatted
    { wch: 30 }, // Note
    { wch: 15 }  // Created At
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo giao dịch');

  // Add info sheet
  const infoData = [
    { 'Thông tin': 'Báo cáo', 'Giá trị': getReportTitle(groupBy) },
    { 'Thông tin': 'Người xuất', 'Giá trị': user?.name || 'N/A' },
    { 'Thông tin': 'Ngày xuất', 'Giá trị': formatDate(new Date()) },
    { 'Thông tin': 'Tổng giao dịch gốc', 'Giá trị': transactions.length },
    { 'Thông tin': 'Đơn vị tiền tệ', 'Giá trị': user?.currency || 'VND' }
  ];
  const wsInfo = XLSX.utils.json_to_sheet(infoData);
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Thông tin');

  // Save the file
  XLSX.writeFile(wb, `bao-cao-giao-dich-${groupBy}-${new Date().getTime()}.xlsx`);
};

// Export statistics to PDF (async due to dynamic imports of heavy libraries)
export const exportStatsToPDF = async (stats, user) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const { robotoBase64 } = await import('./robotoFont');

  const doc = new jsPDF();
  doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.setFont('Roboto');

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.text('BÁO CÁO THỐNG KÊ CHI TIÊU', 14, 20);

  // Add user info and date
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Người xuất: ${user?.name || 'N/A'}`, 14, 30);
  doc.text(`Ngày xuất: ${formatDate(new Date())}`, 14, 35);

  // Add summary if available
  if (stats.summary) {
    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39);
    doc.text('Tổng quan thời gian', 14, 48);

    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.text(`Tổng thu: ${formatCurrency(stats.summary.totalIncome, user?.currency)}`, 14, 58);
    doc.setTextColor(239, 68, 68); // Red 500
    doc.text(`Tổng chi: ${formatCurrency(stats.summary.totalExpense, user?.currency)}`, 14, 64);

    const balance = stats.summary.balance ?? (stats.summary.totalIncome - stats.summary.totalExpense);
    if (balance >= 0) {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(`Số dư ròng: ${formatCurrency(balance, user?.currency)}`, 14, 70);
  }

  // Add category stats if available
  if (stats.categoryStats && stats.categoryStats.length > 0) {
    const tableData = stats.categoryStats.map(cat => [
      cat.category || 'Khác',
      cat.type === 'income' ? 'Thu nhập' : 'Chi tiêu',
      formatCurrency(cat.total, user?.currency),
      cat.count
    ]);

    autoTable(doc, {
      startY: 82,
      head: [['Danh mục', 'Loại giao dịch', 'Tổng tiền', 'Số lượt giao dịch']],
      body: tableData,
      styles: { font: 'Roboto', fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });
  }

  // Save the PDF
  doc.save(`bao-cao-thong-ke-${new Date().getTime()}.pdf`);
};
