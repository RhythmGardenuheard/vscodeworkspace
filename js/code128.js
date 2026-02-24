// Code128 條碼解碼和驗證類
class Code128Decoder {
    constructor() {
        // Code128 編碼表
        this.codeA = 'ÌÍÎÏÐÑÒÓÔÕÖÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_';
        this.codeB = 'ÌÍÎÏÐÑÒÓÔÕÖÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
        
        // 起始字符
        this.START_A = 103;
        this.START_B = 104;
        this.START_C = 105;
        
        // 切換代碼
        this.CODE_A = 101;
        this.CODE_B = 100;
        this.CODE_C = 99;
        this.SHIFT = 98;
        this.STOP = 106;
        
        // 簡單的檢查數字模式
        this.numberPattern = /^\d+$/;
    }

    // 驗證 Code128 條碼
    validate(barcode) {
        // 基本驗證：長度至少為 3（起始 + 數據 + 停止）
        if (!barcode || barcode.length < 2) {
            return {
                isValid: false,
                error: '條碼數據太短',
                data: barcode
            };
        }

        // 檢查是否全數字（Code128-C 通常用於數字）
        if (this.numberPattern.test(barcode)) {
            return {
                isValid: true,
                type: 'Code128-C',
                data: barcode,
                length: barcode.length,
                format: '數字格式'
            };
        } else {
            // 檢查是否包含有效字符
            if (this.isValidCode128(barcode)) {
                return {
                    isValid: true,
                    type: 'Code128-B',
                    data: barcode,
                    length: barcode.length,
                    format: '文本格式'
                };
            }
        }

        return {
            isValid: false,
            error: '包含無效字符',
            data: barcode
        };
    }

    // 檢查是否為有效的 Code128 字符
    isValidCode128(str) {
        // Code128-B 支持的字符範圍
        for (let char of str) {
            const code = char.charCodeAt(0);
            // ASCII 32-126 是 Code128-B 的有效範圍
            if (code < 32 || code > 126) {
                return false;
            }
        }
        return true;
    }

    // 解析 Code128 條碼
    decode(barcode) {
        return this.validate(barcode);
    }

    // 計算檢查碼
    calculateChecksum(data) {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data.charCodeAt(i) * (i + 1);
        }
        return sum % 103;
    }

    // 生成 Code128 條碼
    generateBarcode(data) {
        // 簡單的條碼生成（返回可視化表示）
        if (!this.isValidCode128(data)) {
            return null;
        }

        return {
            original: data,
            encoded: data,
            checksum: this.calculateChecksum(data),
            isValid: true
        };
    }
}

// 導出類
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Code128Decoder;
}
