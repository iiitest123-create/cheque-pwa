let deferredPrompt = null;
let dashboardData = null;

const roleTabs = document.querySelectorAll('.role-tab');
const screens = document.querySelectorAll('.screen');
const installBtn = document.getElementById('installBtn');
const refreshBtn = document.getElementById('refreshBtn');
const ocrPreview = document.getElementById('ocrPreview');
const drawer = document.getElementById('detailDrawer');
const drawerBody = document.getElementById('drawerBody');
const drawerSub = document.getElementById('drawerSub');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');

roleTabs.forEach(btn => {
  btn.addEventListener('click', () => {
    roleTabs.forEach(x => x.classList.remove('active'));
    screens.forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`screen-${btn.dataset.role}`).classList.add('active');
  });
});

document.querySelector('[data-demo="ocr"]')?.addEventListener('click', () => {
  ocrPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
  ocrPreview.animate([
    { transform: 'scale(0.98)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
    { transform: 'scale(1.01)', boxShadow: '0 24px 48px rgba(189,75,45,.18)' },
    { transform: 'scale(1)', boxShadow: '' }
  ], { duration: 450, easing: 'ease-out' });
});

refreshBtn?.addEventListener('click', () => {
  loadDashboard(true);
});

closeDrawerBtn?.addEventListener('click', hideDrawer);
drawer?.addEventListener('click', (event) => {
  if (event.target === drawer) hideDrawer();
});

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove('hidden');
});

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add('hidden');
});

function currency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD' }).format(amount);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function badgeClass(status) {
  if (['已寫入', '已過數', '已上傳', 'sheet_written'].includes(status)) return 'green';
  if (['待確認', 'pending_confirmation', '待上傳', '已壓縮', '待過數'].includes(status)) return 'amber';
  if (['寫入失敗', '上傳失敗', '異常', 'sheet_failed'].includes(status)) return 'red';
  return 'amber';
}

function renderStore(records, summary) {
  document.getElementById('storeMeta').textContent = `目前 ledger 共 ${summary.total} 筆；以下是最新 5 筆`;
  const root = document.getElementById('storeRecentList');
  root.innerHTML = records.slice(0, 5).map(record => `
    <button class="mini-item clickable" data-record-key="${escapeHtml(record.recordKey)}">
      <div>
        <div class="mini-title">${escapeHtml(record.fields.storeCode)}｜${escapeHtml(record.fields.chequeType)}</div>
        <div class="mini-sub">${escapeHtml(record.fields.chequeNumber || '-') } · ${escapeHtml(currency(record.fields.chequeAmount))}</div>
      </div>
      <span class="badge ${badgeClass(record.sheetStatus)}">${escapeHtml(record.sheetStatus)}</span>
    </button>
  `).join('');
}

function renderAdmin(records, summary) {
  document.getElementById('adminPendingCount').textContent = summary.pendingConfirmation;
  document.getElementById('adminImagePendingCount').textContent = summary.imagePending + summary.imageCompressed;
  document.getElementById('adminWrittenCount').textContent = summary.sheetWritten;
  document.getElementById('adminMeta').textContent = `最新同步：${new Date().toLocaleTimeString('zh-HK', { hour12: false })}`;

  const tbody = document.getElementById('adminTableBody');
  tbody.innerHTML = records.slice(0, 10).map(record => `
    <tr>
      <td>${escapeHtml(record.fields.storeCode)}</td>
      <td>${escapeHtml(record.fields.chequeType)}</td>
      <td>${escapeHtml(record.fields.chequeNumber || '-')}</td>
      <td>${escapeHtml(currency(record.fields.chequeAmount))}</td>
      <td>${escapeHtml(record.fields.payeeName || '-')}</td>
      <td><span class="badge ${badgeClass(record.sheetStatus === '已寫入' ? record.sheetStatus : record.recordStatus)}">${escapeHtml(record.sheetStatus === '已寫入' ? record.sheetStatus : record.recordStatus)}</span></td>
      <td><button class="link-btn" data-record-key="${escapeHtml(record.recordKey)}">查看</button></td>
    </tr>
  `).join('');
}

function renderAccounting(records, summary) {
  document.getElementById('acctUpcomingCount').textContent = summary.accountingUpcoming;
  document.getElementById('acctOverdueCount').textContent = summary.accountingOverdue;
  document.getElementById('acctTotalCount').textContent = summary.total;

  const root = document.getElementById('accountingList');
  root.innerHTML = records.slice(0, 8).map(record => {
    const acct = record.accounting || {};
    const status = acct.followUpStatus || '待過數';
    const border = status === '異常' ? 'border-danger' : (status === '待跟進' ? 'border-warning' : 'border-ok');
    return `
      <button class="mini-item clickable ${border}" data-record-key="${escapeHtml(record.recordKey)}">
        <div>
          <div class="mini-title">${escapeHtml(record.fields.storeCode)}｜${escapeHtml(record.fields.chequeNumber || '-')}｜${escapeHtml(currency(record.fields.chequeAmount))}</div>
          <div class="mini-sub">支票日：${escapeHtml(record.fields.chequePaymentDate || '-')} · ${escapeHtml(acct.note || '等待會計處理')}</div>
        </div>
        <span class="badge ${badgeClass(status)}">${escapeHtml(status)}</span>
      </button>
    `;
  }).join('');
}

function attachRecordClicks() {
  document.querySelectorAll('[data-record-key]').forEach(el => {
    el.addEventListener('click', () => showRecordDetail(el.dataset.recordKey));
  });
}

function showRecordDetail(recordKey) {
  if (!dashboardData) return;
  const record = dashboardData.records.find(r => r.recordKey === recordKey);
  if (!record) return;

  drawerSub.textContent = `${record.fields.storeCode}｜${record.fields.chequeType}｜${record.recordKey}`;
  drawerBody.innerHTML = `
    <div class="detail-grid">
      <div><strong>輸入日期：</strong>${escapeHtml(record.fields.inputDate || '-')}</div>
      <div><strong>支票付款日期：</strong>${escapeHtml(record.fields.chequePaymentDate || '-')}</div>
      <div><strong>支票號碼：</strong>${escapeHtml(record.fields.chequeNumber || '-')}</div>
      <div><strong>支票金額：</strong>${escapeHtml(currency(record.fields.chequeAmount))}</div>
      <div><strong>收款公司：</strong>${escapeHtml(record.fields.payeeName || '-')}</div>
      <div><strong>Invoice No.：</strong>${escapeHtml(record.fields.invoiceNo || '-')}</div>
      <div><strong>備註：</strong>${escapeHtml(record.fields.remarks || '-')}</div>
      <div><strong>提交者：</strong>${escapeHtml(record.confirmation.originalSubmitterLabel || '-')}</div>
      <div><strong>確認者：</strong>${escapeHtml(record.confirmation.confirmedBy || '-')}</div>
      <div><strong>記錄狀態：</strong>${escapeHtml(record.recordStatus)}</div>
      <div><strong>寫表狀態：</strong>${escapeHtml(record.sheetStatus)}</div>
      <div><strong>圖片狀態：</strong>${escapeHtml(record.imageStatus)}</div>
      <div><strong>圖片來源：</strong><span class="path">${escapeHtml(record.images.inboundMediaPath || '-')}</span></div>
      <div><strong>壓縮圖片：</strong><span class="path">${escapeHtml(record.images.compressedImagePath || '-')}</span></div>
      <div><strong>最後更新：</strong>${escapeHtml(new Date(record.updatedAt).toLocaleString('zh-HK'))}</div>
    </div>
  `;
  drawer.classList.remove('hidden');
}

function hideDrawer() {
  drawer.classList.add('hidden');
}

async function loadDashboard(isManual = false) {
  try {
    if (isManual) refreshBtn.textContent = '更新中…';
    const response = await fetch('./api/dashboard');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    dashboardData = await response.json();

    renderStore(dashboardData.records, dashboardData.summary);
    renderAdmin(dashboardData.records, dashboardData.summary);
    renderAccounting(dashboardData.accountingRecords, dashboardData.summary);
    attachRecordClicks();
  } catch (error) {
    console.error(error);
    document.getElementById('storeMeta').textContent = '載入 ledger 失敗';
    document.getElementById('adminMeta').textContent = '載入失敗';
  } finally {
    refreshBtn.textContent = '重新整理資料';
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

loadDashboard();