var storedTestname = localStorage.getItem('currentTestname');
examEndTimeGlobal = new Date(localStorage.getItem('examEndTimeGlobal')); //从localStorage读取并转换回Date对象
var studentUsername = localStorage.getItem('currentStudentUsername');
function submitExam() {
  let isConfirmed = confirm('您确定要提交试卷吗？');  // 弹出确认对话框
  if (isConfirmed) {
      window.location.href = 'student.html';
  }
}
function loadQuestions() {
    // 检查是否存在这个考试
    if (!storedTestname) {
      console.error('没有找到考试');
      return;
    }
    fetch(`http://localhost:3000/loadQuestions?examName=${storedTestname}&studentUsername=${studentUsername}`)
      .then(response => response.json())
      .then(questions => {
        // 清空现有表格内容
        var table = document.getElementById('table');
        table.innerHTML = `
          <tr>
            <th>序号</th>
            <th>题目</th>
            <th>题目类型</th>
            <th>作答</th>
          </tr>
        `;
        //填充表格
        questions.forEach((question, index) => {
            var row = table.insertRow(-1);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);
            cell1.className = 'other-column';
            cell2.className = 'question-column';
            cell3.className = 'other-column';
            cell4.className = 'other-column';
            cell1.innerHTML = index + 1;
            cell2.innerHTML = question.question;
            cell3.innerHTML = question.type;
            var answerBtn = document.createElement('button');
            answerBtn.innerHTML = '作答';
            answerBtn.onclick = function() { addAnswer(index, questions); }; // 传递 questions 数组
            cell4.appendChild(answerBtn);
          });
      })
      .catch(error => {
        console.error('加载题目时发生错误:', error);
      });
}

function addAnswer(questionIndex, questions) {
  let answer = prompt('请输入你的答案：');
  if (answer) {
    const requestBody = {
      examName: storedTestname,
      studentUsername: studentUsername, 
      index: questionIndex + 1,
      newAnswer: answer
    };
    fetch('http://localhost:3000/updateAnswer', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody) 
    })
      .then(response => {
        if (response.ok) { 
          return response.json();
        }
        throw new Error('Network response was not ok.');
      })
      .then(data => {
        if (data.success) {
          // 更新答案
          questions[questionIndex].answer = answer;
          // 刷新页面显示新答案
          //window.location.reload();
        } else {
          alert('更新答案失败，请稍后重试。');
        }
      })
      .catch(error => {
        console.error('更新答案时发生错误:', error);
        alert('更新答案时发生错误，请稍后重试。');
      });
    }
}
// 时间处理函数
function formatTime(time) {
    let hours = Math.floor(time / 3600000);
    let minutes = Math.floor((time % 3600000) / 60000);
    let seconds = Math.floor((time % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    const timerElement = document.getElementById('countdown-timer');
    // 使用全局变量examEndTimeGlobal
    const updateTimer = setInterval(() => {
        let remainingTime = examEndTimeGlobal - new Date();
        if (remainingTime <= 0) {
            clearInterval(updateTimer);
            timerElement.innerHTML = '考试时间已到！';
            return;
        }
        timerElement.innerHTML = `距离考试结束还有：${formatTime(remainingTime)}`;
    }, 1000);
}
// 页面加载时调用loadQuestions函数和startTimer函数来加载题目和启动计时器
window.onload = function() {
    loadQuestions();
    startTimer();
};