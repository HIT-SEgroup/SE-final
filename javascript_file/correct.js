var correctTestname = localStorage.getItem('currentCorrectTestname');// 全局变量
// 用于从服务器加载批改题目信息并填充到页面的表格
function loadCorrectPage() {
    const table = document.getElementById('table'); // 获取表格元素
    table.innerHTML = `
        <tr>
            <th>序号</th>
            <th>题目</th>
            <th>学生答案</th>
            <th>标准答案</th>
            <th>批改结果</th>
            <th>操作</th>
        </tr>
    `; // 清空现有表格内容
    // 发送请求到服务器，获取题目数据
    fetch(`http://localhost:3000/loadCorrectQuestions?examName=${correctTestname}`)
        .then(response => {
            return response.json();
        })
        .then(questions => {
            questions.forEach((question, index) => {// 向表格添加一行
                let row = table.insertRow(-1);
                let cellIndex = row.insertCell(0);
                let cellQuestion = row.insertCell(1);
                let cellStudentAnswer = row.insertCell(2);
                let cellStandardAnswer = row.insertCell(3);
                let cellCorrectionResult = row.insertCell(4);
                let cellOperation = row.insertCell(5);
                // 设置单元格内容
                cellIndex.textContent = index + 1;
                cellQuestion.textContent = question[1]; // 题目
                cellStudentAnswer.textContent = question[3]; // 学生答案
                cellStandardAnswer.textContent = question[2]; // 标准答案
                cellCorrectionResult.textContent = question[4] || '未批改';
                let correctionBtn = document.createElement('button');
                correctionBtn.textContent = '批改';// 添加批改按钮
                correctionBtn.onclick = function() { correctAnswer(index, question); };
                cellOperation.appendChild(correctionBtn);
            });
        })
        .catch(error => {
            console.error('加载批改信息时发生错误:', error);
        });
}
//处理批改操作
function correctAnswer(index, question) {
    let correctionResult = prompt('请输入批改结果(T 或 F):');
    if (correctionResult !== 'T' && correctionResult !== 'F') {
        alert('输入不合法,请输入T或F。');
        return;
    }
    const requestBody = {
        examName: correctTestname,
        index: index + 1,
        correctionResult: correctionResult
    };
    fetch('http://localhost:3000/correctAnswer', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody) 
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        if (data.success) {
            document.querySelector(`#table tbody tr:nth-child(${index + 2}) .correction-result`).textContent = correctionResult;// 直接更新页面上对应单元格的批改结果
        } else {
            alert('批改失败，请稍后重试。');
        }
    })
    .catch(error => {
        console.error('批改答案时发生错误:', error);
    });
}
document.addEventListener('DOMContentLoaded', function() {
    loadCorrectPage();
});