document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);// 获取URL中的查询参数
    const examName = urlParams.get('examName');// 获取examName参数的值
    if (!examName) {
      alert('没有提供考试文件名。');
      return;
    }
    const examFileUrl = `./data/stu1_stu/${examName}`;
    fetch(examFileUrl)    // 使用AJAX请求获取考试文件的内容
      .then(response => {
        if (!response.ok) {
          throw new Error('网络响应错误: ' + response.statusText);
        }
        return response.text(); // 读取文件内容作为文本
      })
      .then(textContent => {
        // 将文本按行分割
        const lines = textContent.split('\n');
        // 创建表格并添加到页面
        createExamTable(lines);
      })
      .catch(error => {
        console.error('获取考试文件失败:', error);
        alert('获取考试文件失败，请检查文件名是否正确或文件路径是否正确。');
      });
  });
  
  function createExamTable(lines) {
    // 创建表格元素
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '20px';
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    table.appendChild(thead);
    table.appendChild(tbody);
  
    // 添加表头
    const headerRow = document.createElement('tr');
    ['题目', '题目类型', '正确答案', '你的答案', '批改结果'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      th.style.border = '1px solid #ddd';
      th.style.padding = '8px';
      th.style.backgroundColor = '#ddd';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
  
    // 遍历每行数据，添加到表格中
    lines.forEach(line => {
      if (line.trim() === '') return; // 忽略空行
      const row = document.createElement('tr');
      const columns = line.split(',');
      columns.forEach(columnText => {
        const td = document.createElement('td');
        td.textContent = columnText;
        td.style.border = '1px solid #ddd';
        td.style.padding = '8px';
        td.style.textOverflow = 'ellipsis'; // 如果内容过长显示省略号
        td.style.overflow = 'hidden';
        td.style.maxWidth = '0'; // 宽度自适应内容
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    document.body.appendChild(table);// 将表格添加到页面中
  }