// 1. 取得 DOM 元素
const form = document.getElementById('record-form');
const typeInput = document.getElementById('type');
const categoryInput = document.getElementById('category');
const amountInput = document.getElementById('amount');
const noteInput = document.getElementById('note');

const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const netBalanceEl = document.getElementById('net-balance');
const containerEl = document.getElementById('monthly-records-container');
const editInitialBtn = document.getElementById('edit-initial-btn');

// 2. 本地資料讀取
let records = JSON.parse(localStorage.getItem('my_records')) || [];
let initialBalance = Number(localStorage.getItem('initial_balance')) || 0;

// 3. 修改初始金額
editInitialBtn.addEventListener('click', () => {
  const newAmount = prompt('請輸入你的初始總金額/預設收入：', initialBalance);
  if (newAmount !== null && !isNaN(newAmount) && newAmount.trim() !== '') {
    initialBalance = Number(newAmount);
    localStorage.setItem('initial_balance', initialBalance);
    updateUI();
  }
});

// 4. 更新 UI 畫面（按月份分組 + 計算）
function updateUI() {
  containerEl.innerHTML = '';

  let totalIncome = initialBalance;
  let totalExpense = 0;

  const groupedRecords = {};

  records.forEach((record) => {
    // 累加總金額
    if (record.type === 'income') {
      totalIncome += record.amount;
    } else {
      totalExpense += record.amount;
    }

    // 防錯機制：如果舊資料沒有 monthKey，則嘗試用 date 解析
    let monthKey = record.monthKey;
    if (!monthKey && record.date) {
      monthKey = record.date.substring(0, 7).replace('/', '-');
    }
    if (!monthKey) {
      const now = new Date();
      monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!groupedRecords[monthKey]) {
      groupedRecords[monthKey] = [];
    }
    groupedRecords[monthKey].push(record);
  });

  const sortedMonths = Object.keys(groupedRecords).sort().reverse();

  if (sortedMonths.length === 0) {
    containerEl.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px 0;">尚無記帳紀錄，新增一筆試試吧！</p>';
  }

  sortedMonths.forEach((month) => {
    const monthRecords = groupedRecords[month];

    // 計算當月總支出
    const monthTotalExpense = monthRecords
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);

    const parts = month.split('-');
    const monthName = parts.length >= 2 ? `${parts[0]} 年 ${parts[1]} 月` : month;

    // 建立卡片容器
    const groupDiv = document.createElement('div');
    groupDiv.className = 'month-group';

    // 卡片標題（點擊收合）
    const headerDiv = document.createElement('div');
    headerDiv.className = 'month-header';
    headerDiv.innerHTML = `
      <span class="month-title">📅 ${monthName}</span>
      <span class="month-summary">支出：$${monthTotalExpense}</span>
    `;

    // 明細區域
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'month-body';

    headerDiv.addEventListener('click', () => {
      bodyDiv.classList.toggle('collapsed');
    });

    monthRecords.forEach((record) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = `record-item ${record.type}`;
      const sign = record.type === 'income' ? '+' : '-';

      itemDiv.innerHTML = `
        <div class="record-info">
          <span class="record-title">[${record.category}] ${record.note || '無備註'}</span>
          <span class="record-date">${record.date}</span>
        </div>
        <div class="record-amount-group">
          <span>${sign}$${record.amount}</span>
          <button class="delete-btn" onclick="deleteRecord(${record.id})">✕</button>
        </div>
      `;
      bodyDiv.appendChild(itemDiv);
    });

    groupDiv.appendChild(headerDiv);
    groupDiv.appendChild(bodyDiv);
    containerEl.appendChild(groupDiv);
  });

  totalIncomeEl.innerText = `$${totalIncome}`;
  totalExpenseEl.innerText = `$${totalExpense}`;
  netBalanceEl.innerText = `$${totalIncome - totalExpense}`;

  localStorage.setItem('my_records', JSON.stringify(records));
}

// 5. 新增紀錄
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const formattedDate = `${year}-${month}-${day}`;
  const monthKey = `${year}-${month}`;

  const newRecord = {
    id: Date.now(),
    type: typeInput.value,
    category: categoryInput.value,
    amount: Number(amountInput.value),
    note: noteInput.value,
    date: formattedDate,
    monthKey: monthKey
  };

  records.unshift(newRecord);
  updateUI();

  amountInput.value = '';
  noteInput.value = '';
});

// 6. 刪除紀錄
function deleteRecord(id) {
  records = records.filter(record => record.id !== id);
  updateUI();
}

updateUI();