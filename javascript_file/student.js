var currentTestname = null;//全局变量
var examEndTimeGlobal = null;//全局变量保存考试结束时间
var studentUsername = localStorage.getItem('currentStudentUsername');
document.addEventListener('DOMContentLoaded', function() {
    fetchExamList();
});

function fetchExamList() {
    fetch(`http://localhost:3000/getExamList?studentUsername=${studentUsername}`, {
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
            startExamBtn.textContent = '开始作答';
            startExamBtn.setAttribute('data-exam-name', exam.name); 
            startExamBtn.className = 'start-exam-btn'; // 添加类名以便后续添加事件监听器
            // 将按钮添加到操作单元格
            actionCell.appendChild(startExamBtn);
        });
        addStartExamEventListener(); //在数据填充完成后添加事件监听器
    })
    .catch(error => console.error('Error fetching exam list:', error));
}
function addStartExamEventListener() {
    const startExamBtns = document.querySelectorAll('.start-exam-btn');
    startExamBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const examName = this.getAttribute('data-exam-name');
        localStorage.setItem('currentTestname', examName);
        fetch(`http://localhost:3000/prepareExam`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ examName, studentUsername }) 
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                alert(data.error);
                return;
            }
            // 设置考试结束时间并跳转到test.html
            localStorage.setItem('examEndTimeGlobal', data.endTime);
            window.location.href = 'test.html'; 
        })
        .catch(error => console.error('Error preparing the exam:', error));
      });
    });
  }
document.addEventListener('DOMContentLoaded', addStartExamEventListener);