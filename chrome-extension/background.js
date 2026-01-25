// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "send-to-philmong",
        title: "Philmong으로 주문 보내기",
        contexts: ["selection"]
    });
});

// Handle click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "send-to-philmong" && info.selectionText) {

        // Send to API
        fetch('http://localhost:3000/api/naver-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: info.selectionText })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success notification (basic alert via scripting)
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => alert('✅ 필몽: 주문이 성공적으로 접수되었습니다! \n(관리 페이지에서 확인하세요)')
                    });
                } else {
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: (err) => alert('❌ 실패: ' + err),
                        args: [data.error || 'Unknown error']
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => alert('❌ 서버 연결 실패! \n필몽 서버(localhost:3000)가 켜져 있는지 확인하세요.')
                });
            });
    }
});
