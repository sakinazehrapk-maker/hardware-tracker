const equipmentForm = document.getElementById('add-equipment-form');
const itemNameInput = document.getElementById('item-name');
const assetIdInput = document.getElementById('asset-id');
const equipmentList = document.getElementById('equipment-list');
let equipmentItems = JSON.parse(localStorage.getItem('equipmentItems')) || [];
function saveToLocalStorage() {
  localStorage.setItem('equipmentItems', JSON.stringify(equipmentItems));
}
equipmentForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const name = itemNameInput.value.trim();
  const assetId = assetIdInput.value.trim();
  if (!name || !assetId) return;
  const newEquipment={
    id: Date.now(),
    name: name,
    assetId: assetId,
    status: 'Available',
  };
  equipmentItems.push(newEquipment);
  saveToLocalStorage();
  renderEquipmentList();
  equipmentForm.reset();
});
function toggleStatus(id) {
  equipmentItems = equipmentItems.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status: item.status === 'Available' ? 'Checked Out' : 'Available',
      };
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
function renderEquipmentList() {
  equipmentList.innerHTML = '';
  if (equipmentItems.length === 0) {
    equipmentList.innerHTML = '<li style="color: #a0aec0;">No equipment added yet.</li>';
    return;
  }
  equipmentItems.forEach((item) => {
    const isAvailable = item.status === 'Available';
    const badgeStyle = isAvailable
      ? 'background: #e6fffa; color: #234e52;'
      : 'background: #fff5f5; color: #9b2c2c;';
    const actionText = isAvailable ? 'Check Out' : 'Check In';
    const actionBtnClass=isAvailable ? 'btn-checkout' : 'btn-checkin';
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${item.name}</strong> 
        <span style="color: #718096; font-size: 0.85rem; margin-left: 6px;">(${item.assetId})</span>
        <span style="${badgeStyle} padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; margin-left: 8px;">
          ${item.status}
        </span>
      </div>
      <div style="display: flex; gap: 8px;">
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
window.toggleStatus=toggleStatus;
window.deleteItem=deleteItem;
renderEquipmentList();