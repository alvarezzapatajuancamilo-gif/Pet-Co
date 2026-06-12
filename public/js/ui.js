/**
 * UI Utilities Helper
 */

// Show toast notification
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `custom-toast toast-${type}`;
  
  // Icon based on type
  let icon = 'fa-check-circle text-primary';
  if (type === 'error') icon = 'fa-times-circle text-danger';
  if (type === 'warning') icon = 'fa-exclamation-triangle text-warning';
  if (type === 'info') icon = 'fa-info-circle text-info';

  toast.innerHTML = `
    <i class="fa-solid ${icon} fs-5"></i>
    <div class="flex-grow-1 fw-medium">${message}</div>
    <button type="button" class="btn-close ms-auto" aria-label="Close" style="font-size: 0.8rem;"></button>
  `;

  container.appendChild(toast);

  // Trigger anim
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Close event
  toast.querySelector('.btn-close').addEventListener('click', () => {
    dismissToast(toast);
  });

  // Auto-dismiss after 4 seconds
  const timeoutId = setTimeout(() => {
    dismissToast(toast);
  }, 4000);

  toast.dataset.timeoutId = timeoutId;
}

function dismissToast(toast) {
  if (toast.dataset.timeoutId) {
    clearTimeout(toast.dataset.timeoutId);
  }
  toast.classList.remove('show');
  setTimeout(() => {
    toast.remove();
  }, 300);
}

// Show/Hide page spinner
let activeSpinners = 0;
let loadingOverlay = null;

export function showLoader() {
  activeSpinners++;
  if (loadingOverlay) return;

  loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = `
    <div class="d-flex flex-column align-items-center gap-3">
      <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <div class="fw-semibold text-primary">Cargando PetShop...</div>
    </div>
  `;
  document.body.appendChild(loadingOverlay);
}

export function hideLoader() {
  activeSpinners--;
  if (activeSpinners <= 0) {
    activeSpinners = 0;
    if (loadingOverlay) {
      loadingOverlay.remove();
      loadingOverlay = null;
    }
  }
}
