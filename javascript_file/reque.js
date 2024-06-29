document.addEventListener('DOMContentLoaded', function() {
    fetchExamList();
});

function fetchExamList() {
  fetch('http://localhost:3000/requeList', {
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
          startExamBtn.textContent = '查看';
          startExamBtn.setAttribute('data-exam-name', exam.name); 
          startExamBtn.className = 'start-exam-btn'; // 添加类名以便后续添加事件监听器

          // 将按钮添加到操作单元格
          actionCell.appendChild(startExamBtn);
      });
      // 在数据填充完成后添加事件监听器
      look();
  })
  .catch(error => console.error('Error fetching exam list:', error));
}

function look() {
    const startExamButtons = document.querySelectorAll('.start-exam-btn'); //获取所有"查看"按钮
    startExamButtons.forEach(button => {  //为每个按钮添加点击事件监听器
      button.addEventListener('click', function() {
        const examName = this.getAttribute('data-exam-name');// 获取按钮的data-exam-name属性值，即考试文件名
        const url = `requestion.html?examName=${encodeURIComponent(examName)}`;
        window.location.href = url;   // 跳转到构建的URL
      });
    });
  }