const equipmentForm = document.getElementById('add-equipment-form');
const itemNameInput = document.getElementById('item-name');
const assetIdInput = document.getElementById('asset-id');
const equipmentList = document.getElementById('equipment-list');
const searchInput = document.getElementById('search-input');
const exportBtn = document.getElementById('export-btn');
let equipmentItems = JSON.parse(localStorage.getItem('equipmentItems')) || [];
function saveToLocalStorage() {
  localStorage.setItem('equipmentItems', JSON.stringify(equipmentItems));
}
equipmentForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const name = itemNameInput.value.trim();
  const assetId = assetIdInput.value.trim();
  if (!name || !assetId) return;
  const newEquipment = {
    id: Date.now(),
    name: name,
    assetId: assetId,
    status: 'Available',
    borrower: null,
  };
  equipmentItems.push(newEquipment);
  saveToLocalStorage();
  renderEquipmentList();
  equipmentForm.reset();
});
function toggleStatus(id) {
  equipmentItems = equipmentItems.map((item) => {
    if (item.id === id) {
      if (item.status === 'Available') {
        const borrowerName = prompt(`Who is checking out "${item.name}"?`);
        if (!borrowerName || !borrowerName.trim()) {
          alert('Check-out cancelled. Borrower name is required.');
          return item;
        }
        return {
          ...item,
          status: 'Checked Out',
          borrower: borrowerName.trim(),
        };
      } else {
        return {
          ...item,
          status: 'Available',
          borrower: null,
        };
      }
    }
    return item;
  });
  saveToLocalStorage();
  renderEquipmentList();
}
function deleteItem(id) {
  equipmentItems = equipmentItems.filter((item) => item.id !== id);
  saveToLocalStorage();
  renderEquipmentList();
}
function exportToCSV() {
  if (equipmentItems.length === 0) {
    alert('No equipment items to export!');
    return;
  }
  const headers = ['Asset ID', 'Item Name', 'Status', 'Borrower'];
  const rows = equipmentItems.map((item) => [
    `"${item.assetId.replace(/"/g, '""')}"`,
    `"${item.name.replace(/"/g, '""')}"`,
    `"${item.status}"`,
    `"${(item.borrower || 'N/A').replace(/"/g, '""')}"`
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
  equipmentList.innerHTML = '';
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filteredItems = equipmentItems.filter((item) => {
    const nameMatch = item.name.toLowerCase().includes(searchTerm);
    const idMatch = item.assetId.toLowerCase().includes(searchTerm);
    const borrowerMatch = item.borrower ? item.borrower.toLowerCase().includes(searchTerm) : false;
    return nameMatch || idMatch || borrowerMatch;
  });
  if (filteredItems.length === 0) {
    equipmentList.innerHTML = '<li style="color: #a0aec0;">No matching equipment found.</li>';
    return;
  }
  filteredItems.forEach((item) => {
    const isAvailable = item.status === 'Available';
    const badgeStyle = isAvailable
      ? 'background: #e6fffa; color: #234e52;'
      : 'background: #fff5f5; color: #9b2c2c;';
    const actionText = isAvailable ? 'Check Out' : 'Check In';
    const actionBtnClass = isAvailable ? 'btn-checkout' : 'btn-checkin';
    const borrowerText = item.borrower 
      ? `<div style="font-size: 0.8rem; color: #e53e3e; margin-top: 4px;">👤 Checked out to: <strong>${item.borrower}</strong></div>`
      : '';
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${item.name}</strong> 
        <span style="color: #718096; font-size: 0.85rem; margin-left: 6px;">(${item.assetId})</span>
        <span style="${badgeStyle} padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; margin-left: 8px;">
          ${item.status}
        </span>
        ${borrowerText}
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="action-btn ${actionBtnClass}" onclick="toggleStatus(${item.id})">
          ${actionText}
        </button>
        <button class="action-btn btn-delete" onclick="deleteItem(${item.id})">
          Delete
        </button>
      </div>
    `;
    equipmentList.appendChild(li);
  });
}
if (searchInput) {
  searchInput.addEventListener('input', renderEquipmentList);
}
if (exportBtn) {
  exportBtn.addEventListener('click', exportToCSV);
}
window.toggleStatus = toggleStatus;
window.deleteItem = deleteItem;
renderEquipmentList();