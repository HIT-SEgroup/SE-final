document.addEventListener('DOMContentLoaded', function() {
    fetchExamList();
});

function fetchExamList() {
  fetch('http://localhost:3000/getnpubExamList', {
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
          startExamBtn.textContent = '发布';
          startExamBtn.setAttribute('data-exam-name', exam.name); 
          startExamBtn.className = 'start-exam-btn'; // 添加类名以便后续添加事件监听
          // 将按钮添加到操作单元格
          actionCell.appendChild(startExamBtn);
      });
      
      // 在数据填充完成后添加事件监听器
      pub();
  })
  .catch(error => console.error('Error fetching exam list:', error));
}

function pub() {
    const startExamBtns = document.querySelectorAll('.start-exam-btn');    // 获取所有的发布按钮
    startExamBtns.forEach(btn => {  // 为每个按钮添加点击事件监听
      btn.addEventListener('click', function() {
        const examName = this.getAttribute('data-exam-name');// 获取考试名称
        fetch('http://localhost:3000/copyExamFile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ examName })
        })
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            alert(`发布成功`);
          } else {
            alert('文件复制失败：' + result.error);
          }
        })
        .catch(error => {
          console.error('Error copying exam file:', error);
          alert('文件复制请求失败');
        });
      });
    });
  }