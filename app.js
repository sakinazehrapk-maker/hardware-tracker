const equipmentForm = document.getElementById('add-equipment-form');
const itemNameInput = document.getElementById('item-name');
const assetIdInput = document.getElementById('asset-id');
const itemCategoryInput = document.getElementById('item-category');
const equipmentList = document.getElementById('equipment-list');
const searchInput = document.getElementById('search-input');
const exportBtn = document.getElementById('export-btn');
const categoryChipsContainer = document.getElementById('category-chips');
const historyModal = document.getElementById('history-modal');
const historyList = document.getElementById('history-list');
const modalTitle = document.getElementById('modal-title');
const closeModalBtn = document.getElementById('close-modal-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
  document.body.classList.add('dark-mode');
  if (themeToggleBtn) themeToggleBtn.textContent = 'Light Mode';
}
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    let theme = 'light';
    if (document.body.classList.contains('dark-mode')) {
      theme = 'dark';
      themeToggleBtn.textContent = 'Light Mode';
    } else {
      themeToggleBtn.textContent = 'Dark Mode';
    }
    localStorage.setItem('theme', theme);
  });
}
let equipmentItems = JSON.parse(localStorage.getItem('equipmentItems')) || [];
let activeCategoryFilter = 'All';
function saveToLocalStorage() {
  localStorage.setItem('equipmentItems', JSON.stringify(equipmentItems));
}
function getFormattedTimestamp() {
  const now = new Date();
  return now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
equipmentForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const name = itemNameInput.value.trim();
  const assetId = assetIdInput.value.trim();
  const category = itemCategoryInput ? itemCategoryInput.value : 'General';
  if (!name || !assetId) return;
  const newEquipment = {
    id: Date.now(),
    name: name,
    assetId: assetId,
    category: category,
    status: 'Available',
    borrower: null,
    dueDate: null,
    history: [
      {
        action: 'Added to Inventory',
        borrower: 'System',
        timestamp: getFormattedTimestamp(),
      }
    ]
  };
  equipmentItems.push(newEquipment);
  saveToLocalStorage();
  renderEquipmentList();
  equipmentForm.reset();
});
function toggleStatus(id) {
  equipmentItems = equipmentItems.map((item) => {
    if (item.id === id) {
      const history = item.history || [];
      const timestamp = getFormattedTimestamp();
      if (item.status === 'Available') {
        const borrowerName = prompt(`Who is checking out "${item.name}"?`);
        if (!borrowerName || !borrowerName.trim()) {
          alert('Check-out cancelled. Borrower name is required.');
          return item;
        }
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        const defaultDateStr = defaultDate.toISOString().split('T')[0];
        const dueDateInput = prompt(
          `Enter return due date for "${item.name}" (YYYY-MM-DD):`,
          defaultDateStr
        );
        history.unshift({
          action: 'Checked Out',
          borrower: borrowerName.trim(),
          timestamp: timestamp,
        });
        return {
          ...item,
          status: 'Checked Out',
          borrower: borrowerName.trim(),
          dueDate: dueDateInput ? dueDateInput.trim() : defaultDateStr,
          history: history,
        };
      } else {
        const previousBorrower = item.borrower;
        history.unshift({
          action: 'Checked In',
          borrower: previousBorrower || 'Unknown',
          timestamp: timestamp,
        });
        return {
          ...item,
          status: 'Available',
          borrower: null,
          dueDate: null,
          history: history,
        };
      }
    }
    return item;
  });
  saveToLocalStorage();
  renderEquipmentList();
}
function showHistory(id) {
  const item = equipmentItems.find((i) => i.id === id);
  if (!item) return;
  modalTitle.textContent = `History: ${item.name}`;
  historyList.innerHTML = '';
  const history = item.history || [];
  if (history.length === 0) {
    historyList.innerHTML = '<li style="color: var(--subtext-color);">No history records available.</li>';
  } else {
    history.forEach((entry) => {
      const li = document.createElement('li');
      li.className = 'history-item';
      const isCheckout = entry.action === 'Checked Out';
      const actionClass = isCheckout ? 'checkout' : 'checkin';
      li.innerHTML = `
        <div class="history-action ${actionClass}">${entry.action}</div>
        <div class="history-meta">👤 By/To: <strong>${entry.borrower}</strong> | ${entry.timestamp}</div>
      `;
      historyList.appendChild(li);
    });
  }
  historyModal.style.display = 'flex';
}
if (closeModalBtn) {
  closeModalBtn.onclick = () => { historyModal.style.display = 'none'; };
}
window.onclick = (event) => {
  if (event.target === historyModal) {
    historyModal.style.display = 'none';
  }
};
function deleteItem(id) {
  equipmentItems = equipmentItems.filter((item) => item.id !== id);
  saveToLocalStorage();
  renderEquipmentList();
}
function isOverdue(dueDateStr) {
  if (!dueDateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dueDateStr < today;
}
function updateStats() {
  const total = equipmentItems.length;
  const available = equipmentItems.filter(item => item.status === 'Available').length;
  const checkedOut = equipmentItems.filter(item => item.status === 'Checked Out').length;
  const overdue = equipmentItems.filter(item => item.status === 'Checked Out' && isOverdue(item.dueDate)).length;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-available').textContent = available;
  document.getElementById('stat-checkedout').textContent = checkedOut;
  document.getElementById('stat-overdue').textContent = overdue;
}
function renderCategoryChips() {
  if (!categoryChipsContainer) return;
  const categories = ['All', 'Microcontrollers', 'Testing Gear', 'Sensors', 'Tools & Components', 'General']; 
  categoryChipsContainer.innerHTML = '';
  categories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.className = `chip ${activeCategoryFilter === cat ? 'active' : ''}`;
    chip.textContent = cat;
    chip.onclick = () => {
      activeCategoryFilter = cat;
      renderEquipmentList();
    };
    categoryChipsContainer.appendChild(chip);
  });
}
function exportToCSV() {
  if (equipmentItems.length === 0) {
    alert('No equipment items to export!');
    return;
  }
  const headers = ['Asset ID', 'Item Name', 'Category', 'Status', 'Borrower', 'Due Date', 'Is Overdue'];
  const rows = equipmentItems.map((item) => [
    `"${item.assetId.replace(/"/g, '""')}"`,
    `"${item.name.replace(/"/g, '""')}"`,
    `"${(item.category || 'General').replace(/"/g, '""')}"`,
    `"${item.status}"`,
    `"${(item.borrower || 'N/A').replace(/"/g, '""')}"`,
    `"${item.dueDate || 'N/A'}"`,
    `"${isOverdue(item.dueDate) ? 'YES' : 'NO'}"`
  ]);
  const csvContent = 'data:text/csv;charset=utf-8,' 
    + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10); 
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `equipment_inventory_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
function renderEquipmentList() {
  updateStats();
  renderCategoryChips();
  equipmentList.innerHTML = '';
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filteredItems = equipmentItems.filter((item) => {
    const categoryMatch = activeCategoryFilter === 'All' || item.category === activeCategoryFilter;
    const nameMatch = item.name.toLowerCase().includes(searchTerm);
    const idMatch = item.assetId.toLowerCase().includes(searchTerm);
    const borrowerMatch = item.borrower ? item.borrower.toLowerCase().includes(searchTerm) : false;
    return categoryMatch && (nameMatch || idMatch || borrowerMatch);
  });
  if (filteredItems.length === 0) {
    equipmentList.innerHTML = '<li style="color: var(--subtext-color);">No matching equipment found.</li>';
    return;
  }
  filteredItems.forEach((item) => {
    const isAvailable = item.status === 'Available';
    const itemOverdue = !isAvailable && isOverdue(item.dueDate);
    const badgeStyle = isAvailable
      ? 'background: #e6fffa; color: #234e52;'
      : 'background: #fff5f5; color: #9b2c2c;';
    const actionText = isAvailable ? 'Check Out' : 'Check In';
    const actionBtnClass = isAvailable ? 'btn-checkout' : 'btn-checkin';
    let borrowerDetails = '';
    if (!isAvailable && item.borrower) {
      const overdueBadge = itemOverdue
        ? `<span class="badge-overdue">OVERDUE</span>`
        : '';
      borrowerDetails = `
        <div style="font-size: 0.8rem; color: var(--subtext-color); margin-top: 4px;">
          Borrower: <strong>${item.borrower}</strong> | Due: <strong>${item.dueDate}</strong> ${overdueBadge}
        </div>
      `;
    }
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${item.name}</strong> 
        <span style="color: var(--subtext-color); font-size: 0.85rem; margin-left: 6px;">(${item.assetId})</span>
        <span class="category-tag">${item.category || 'General'}</span>
        <span style="${badgeStyle} padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; margin-left: 8px;">
          ${item.status}
        </span>
        ${borrowerDetails}
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="action-btn ${actionBtnClass}" onclick="toggleStatus(${item.id})">
          ${actionText}
        </button>
        <button class="action-btn btn-history" onclick="showHistory(${item.id})">
          History
        </button>
        <button class="action-btn btn-delete" onclick="deleteItem(${item.id})">
          Delete
        </button>
      </div>
    `;
    equipmentList.appendChild(li);
  });
}
if (searchInput) searchInput.addEventListener('input', renderEquipmentList);
if (exportBtn) exportBtn.addEventListener('click', exportToCSV);
window.toggleStatus = toggleStatus;
window.showHistory = showHistory;
window.deleteItem = deleteItem;
renderEquipmentList();