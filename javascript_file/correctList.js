var currentCorrectTestname = null; // 全局变量

document.addEventListener('DOMContentLoaded', function() {
    fetchExamList();
});

function fetchExamList() {
    fetch('http://localhost:3000/correctExamList', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const table = document.getElementById('examListTable');
        data.forEach(exam => {
            const row = table.insertRow();
            const nameCell = row.insertCell(0);
            const actionCell = row.insertCell(1);
            nameCell.textContent = exam.name;   
            const startExamBtn = document.createElement('button');
            startExamBtn.textContent = '批改';// 创建批改按钮
            startExamBtn.setAttribute('data-exam-name', exam.name);
            startExamBtn.className = 'start-exam-btn';
            startExamBtn.addEventListener('click', function() {
            handleExamCorrection(this.getAttribute('data-exam-name')); // 处理点击
            });
            // 将按钮添加到操作单元格
            actionCell.appendChild(startExamBtn);
        });
    })
    .catch(error => console.error('Error fetching exam list:', error));
}

function handleExamCorrection(examName) {
    fetch('http://localhost:3000/prepareCorrection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ examName })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentCorrectTestname = examName; // 更新全局变量
            localStorage.setItem('currentCorrectTestname', examName);
            if (data.message) {
                alert(data.message); // 显示提示信息:你已经批改过了
              }
            window.location.href = 'correct.html';
        } else {
            alert('批改准备失败: ' + (data.message || '未知错误'));
        }
    })
}