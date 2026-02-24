// 掃描器應用主邏輯
let video, canvas, ctx;
let scanning = false;
let decoder = new Code128Decoder();
let scanHistory = [];

const elements = {
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    resetBtn: document.getElementById('resetBtn'),
    video: document.getElementById('video'),
    canvas: document.getElementById('canvas'),
    resultDisplay: document.getElementById('resultDisplay'),
    manualInput: document.getElementById('manualInput'),
    validateBtn: document.getElementById('validateBtn'),
    validationResult: document.getElementById('validationResult'),
    historyList: document.getElementById('historyList'),
    scanCount: document.getElementById('scanCount'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    notification: document.getElementById('notification')
};

// 初始化
function init() {
    video = elements.video;
    canvas = elements.canvas;
    ctx = canvas.getContext('2d', { willReadFrequently: true });

    elements.startBtn.addEventListener('click', startScanning);
    elements.stopBtn.addEventListener('click', stopScanning);
    elements.resetBtn.addEventListener('click', reset);
    elements.validateBtn.addEventListener('click', validateManualInput);
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    elements.manualInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validateManualInput();
    });

    loadHistoryFromStorage();
}

// 檢查攝像頭權限狀態
async function checkCameraPermission() {
    try {
        const permission = await navigator.permissions.query({ name: 'camera' });
        if (permission.state === 'denied') {
            showPermissionGuide();
            return false;
        }
        return true;
    } catch (error) {
        console.error('無法檢查攝像頭權限:', error);
        return true; // 默認允許，避免阻止其他操作
    }
}

// 顯示權限恢復指導
function showPermissionGuide() {
    const guide = document.createElement('div');
    guide.className = 'permission-guide';
    guide.innerHTML = `
        <div class="permission-overlay">
            <div class="permission-modal">
                <h3>📷 需要攝像頭權限</h3>
                <p>請按照以下步驟允許攝像頭訪問：</p>
                <ol>
                    <li>點擊瀏覽器地址欄旁邊的 <strong>🔒 鎖定圖標</strong></li>
                    <li>找到 <strong>攝像頭</strong> 設置</li>
                    <li>將權限改為 <strong>允許</strong></li>
                    <li>刷新頁面重新嘗試</li>
                </ol>
                <div class="permission-actions">
                    <button onclick="this.closest('.permission-guide').remove(); location.reload();">已允許，刷新頁面</button>
                    <button onclick="this.closest('.permission-guide').remove();">稍後再說</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(guide);
}

// 啟動攝像頭
async function startScanning() {
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        video.srcObject = stream;
        scanning = true;
        elements.startBtn.disabled = true;
        elements.stopBtn.disabled = false;

        // 等待視頻加載
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            showNotification('攝像頭已啟動', 'success');
            scanFrame();
        };
    } catch (error) {
        console.error('攝像頭錯誤:', error);
        showNotification('無法訪問攝像頭，請檢查權限設置。', 'error');
    }
}

// 停止掃描
function stopScanning() {
    scanning = false;
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    elements.startBtn.disabled = false;
    elements.stopBtn.disabled = true;
    showNotification('掃描已停止', 'info');
}

// 掃描幀
function scanFrame() {
    if (!scanning) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 簡化的條碼檢測：尋找黑白條紋
    const detected = detectBarcode(imageData);
    
    if (detected) {
        const result = decoder.decode(detected);
        if (result.isValid) {
            displayResult(result);
            addToHistory(result);
            stopScanning();
            return;
        }
    }

    requestAnimationFrame(scanFrame);
}

// 簡化的條碼檢測
function detectBarcode(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // 掃描中間區域（通常條碼在視頻中心）
    const startRow = Math.floor(height * 0.3);
    const endRow = Math.floor(height * 0.7);
    const scanLines = [];

    for (let y = startRow; y < endRow; y += 10) {
        let line = '';
        for (let x = 0; x < width; x += 10) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const brightness = (r + g + b) / 3;
            line += brightness > 128 ? '1' : '0';
        }
        scanLines.push(line);
    }

    // 查找條紋模式
    for (let line of scanLines) {
        if (hasBarPattern(line)) {
            // 從檢測到的條紋返回示例條碼
            return generateMockBarcode();
        }
    }

    return null;
}

// 檢查是否有條紋模式
function hasBarPattern(line) {
    // 計算顏色變化次數（條紋特徵）
    let changes = 0;
    for (let i = 1; i < line.length; i++) {
        if (line[i] !== line[i - 1]) changes++;
    }
    return changes > 10; // 足夠多的顏色變化表示可能是條碼
}

// 模擬條碼檢測
function generateMockBarcode() {
    const mockCodes = [
        'TEST8898777',
        '123456789012',
        'CODE128DEMO',
        '2024022400001',
        'BARCODE001'
    ];
    return mockCodes[Math.floor(Math.random() * mockCodes.length)];
}

// 顯示結果
function displayResult(result) {
    let html = '';
    
    if (result.isValid) {
        html = `
            <div class="result-item">
                <span class="result-label">條碼數據：</span>
                <span class="result-value">${escapeHtml(result.data)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">類型：</span>
                <span class="result-value">${result.type}</span>
            </div>
            <div class="result-item">
                <span class="result-label">長度：</span>
                <span class="result-value">${result.length} 字符</span>
            </div>
            <div class="result-item">
                <span class="result-label">格式：</span>
                <span class="result-value">${result.format}</span>
            </div>
            <div class="result-item">
                <span class="result-label">狀態：</span>
                <span class="result-value" style="color: #4caf50;">✓ 有效</span>
            </div>
        `;
    } else {
        html = `
            <div class="result-item">
                <span class="result-label">錯誤：</span>
                <span class="result-value" style="color: #f44336;">${result.error}</span>
            </div>
        `;
    }

    elements.resultDisplay.innerHTML = html;
}

// 手動驗證輸入
function validateManualInput() {
    const input = elements.manualInput.value.trim();
    
    if (!input) {
        showNotification('請輸入條碼數據', 'error');
        return;
    }

    const result = decoder.decode(input);
    displayValidationResult(result);
    
    if (result.isValid) {
        addToHistory(result);
        elements.manualInput.value = '';
        showNotification('條碼驗證成功', 'success');
    } else {
        showNotification('條碼驗證失敗', 'error');
    }
}

// 顯示驗證結果
function displayValidationResult(result) {
    const resultEl = elements.validationResult;
    resultEl.classList.add('show');

    if (result.isValid) {
        resultEl.className = 'validation-result show success';
        resultEl.innerHTML = `✓ 有效的 ${result.type} 條碼 (${result.length} 字符)`;
    } else {
        resultEl.className = 'validation-result show error';
        resultEl.innerHTML = `✗ ${result.error}`;
    }

    setTimeout(() => {
        resultEl.classList.remove('show');
    }, 3000);
}

// 添加到歷史
function addToHistory(result) {
    const item = {
        data: result.data,
        type: result.type,
        isValid: result.isValid,
        timestamp: new Date().toLocaleTimeString(),
        date: new Date().toISOString()
    };

    scanHistory.unshift(item);
    if (scanHistory.length > 50) {
        scanHistory.pop();
    }

    saveHistoryToStorage();
    updateHistoryDisplay();
}

// 更新歷史顯示
function updateHistoryDisplay() {
    elements.scanCount.textContent = scanHistory.length;

    if (scanHistory.length === 0) {
        elements.historyList.innerHTML = '<p class="placeholder">暫無掃描記錄</p>';
        return;
    }

    elements.historyList.innerHTML = scanHistory.map((item, idx) => `
        <div class="history-item">
            <div class="history-item-data">
                <div class="history-item-code">${escapeHtml(item.data)}</div>
                <div class="history-item-time">${item.timestamp}</div>
            </div>
            <span class="history-item-status ${item.isValid ? 'valid' : 'invalid'}">
                ${item.isValid ? '✓ 有效' : '✗ 無效'}
            </span>
        </div>
    `).join('');
}

// 清除歷史
function clearHistory() {
    if (confirm('確定要清除掃描歷史嗎？')) {
        scanHistory = [];
        saveHistoryToStorage();
        updateHistoryDisplay();
        showNotification('歷史已清除', 'info');
    }
}

// 重置
function reset() {
    elements.resultDisplay.innerHTML = '<p class="placeholder">等待掃描...</p>';
    elements.manualInput.value = '';
    elements.validationResult.classList.remove('show');
    showNotification('已重置', 'info');
}

// 顯示通知
function showNotification(message, type = 'info') {
    elements.notification.textContent = message;
    elements.notification.className = `notification show ${type}`;

    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// 存儲和加載歷史
function saveHistoryToStorage() {
    localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
}

function loadHistoryFromStorage() {
    const saved = localStorage.getItem('scanHistory');
    if (saved) {
        try {
            scanHistory = JSON.parse(saved);
            updateHistoryDisplay();
        } catch (e) {
            console.error('加載歷史錯誤:', e);
        }
    }
}

// HTML 轉義
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// 啟動應用
document.addEventListener('DOMContentLoaded', init);
