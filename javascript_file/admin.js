window.addEventListener('load', function() {
  loadAllQuestionBanks(); // 加载所有题库
});
let currentRowIndex = 0;// 一个全局变量来表示当前的行号
// 用于加载所有题目文件
function loadAllQuestionBanks() {
fetch('http://localhost:3000/getAllQuestions')
  .then(response => response.json())
  .then(data => {
    var table = document.getElementById("table");
    while (table.rows.length > 1) {// 清空现有数据除了表头
      table.deleteRow(1);
    }
    //用于循环添加题目
    function addAllQuestions(questions, teacherUsername) {
      questions.forEach((question, index) => {
        addRowWithData(currentRowIndex++, question, teacherUsername);
      });
    }
    // 加载数据
    data.forEach(questionsGroup => {
      addAllQuestions(questionsGroup.questions, questionsGroup.teacherUsername);
    });
  })
  .catch(error => {
    console.error('加载所有题库失败:', error);
    alert('加载所有题库失败，请稍后再试。');
  });
}
//使用 currentRowIndex 来控制行号
function addRowWithData(rowIndex, question, teacherUsername) {
var table = document.getElementById("table");
var newRow = table.insertRow(-1);
var cellIndex = newRow.insertCell(0);
var cellQuestion = newRow.insertCell(1);
var cellType = newRow.insertCell(2);
var cellAnswer = newRow.insertCell(3);
var cellAction = newRow.insertCell(4);
cellIndex.innerHTML = rowIndex + 1; // 使用全局变量 currentRowIndex 作为序号
cellQuestion.innerHTML = question.question;
cellType.innerHTML = question.type;
cellAnswer.innerHTML = question.answer;
cellAction.innerHTML = "<button onclick='createNewExam(event)'>新建</button> <button onclick='joinExam(event)'>加入</button>";
}
function createNewExam(event) {
  const button = event.target;// 从事件对象中获取按钮元素
  const row = button.parentNode.parentNode; // 获取按钮所在的行
  const rowIndex = row.cells[0].textContent;// 获取行号
  const examName = prompt("请输入试卷名字：");// 弹出提示框让用户输入试卷名字和类型
  if (!examName) {
    alert("输入有误，请重新输入！");
    return;
  }
  // 根据序号筛选题目
  const questionsData = [];
  const table = document.getElementById("table");
  const rows = table.rows;
  for (let i = 1; i < rows.length; i++) { // 从1开始跳过表头
    const row = rows[i];
    const indexCell = row.cells[0];
    if (indexCell.textContent === rowIndex) {
      const questionCell = row.cells[1];
      const typeCell = row.cells[2];
      const answerCell = row.cells[3];
      questionsData.push({
        question: questionCell.textContent,
        type: typeCell.textContent,
        answer: answerCell.textContent
      });
    }
  }
  const examQuestions = questionsData.map(q => `${q.question},${q.type},${q.answer}`).join('\n'); // 将题目数据转换为字符串格式
  saveExam(examName, examQuestions);  //保存试卷
}

function saveExam(examName,examQuestions) {
  const examContent = examQuestions;
  fetch('http://127.0.0.1:3000/saveExam', { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      examName,
      questions: examContent
    })
  })
  .then(response => {
    return response.json(); // 解析 JSON 响应
  })
  .then(data => {
    if (data.success) {
      alert('试卷创建成功！');
    } else {
      alert('试卷创建失败：' + data.error);
    }
  })
  .catch(error => {
    console.error('创建试卷失败:', error);
    alert('创建试卷失败，请稍后再试。');
  });
}

function joinExam(event) {
  const button = event.target; // 从事件对象中获取按钮元素
  const row = button.parentNode.parentNode;// 获取按钮所在的行
  const rowIndex = row.cells[0].textContent; // 获取行号
  const examName = prompt("请输入试卷名字（不包含_test.txt/_practice.txt的部分）：");// 弹出提示框让用户输入试卷名字
  if (!examName) {
    alert("输入有误请重新输入！");
    return;
  }

  const questionsData = [];  // 根据序号筛选题目
  const table = document.getElementById("table");
  const rows = table.rows;
  for (let i = 1; i < rows.length; i++) { // 从1开始跳过表头
    const row = rows[i];
    const indexCell = row.cells[0];
    if (indexCell.textContent === rowIndex) {
      const questionCell = row.cells[1];
      const typeCell = row.cells[2];
      const answerCell = row.cells[3];
      questionsData.push({
        question: questionCell.textContent,
        type: typeCell.textContent,
        answer: answerCell.textContent
      });
    }
  }
  const examQuestions = questionsData.map(q => `${q.question},${q.type},${q.answer}`).join('\n');
  fetch('http://127.0.0.1:3000/joinExam', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        examName: examName + "_practice", 
        questions: examQuestions
      })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('试卷加入成功！');
    } else {
      alert('试卷加入失败：' + data.error);
    }
  })
  .catch(error => {
    console.error('加入试卷失败:', error);
    alert('加入试卷失败，请稍后再试。');
  });
}
function previewExam() {
  const examName = prompt("请输入试卷名字(不含_practice.txt的部分):");
  if (!examName) {
    alert("输入有误请重新输入");
    return;
  }
  fetch(`http://localhost:3000/previewExam?examName=${examName}`)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
      } else {
        const previewWindow = window.open('', '_blank');        // 显示预览内容，在新窗口展示
        previewWindow.document.write('<h1>试卷预览 - ' + examName + '_practice.txt</h1>');
        previewWindow.document.write('<ul>');
        data.questions.forEach((question, index) => {
          // 每题的数据格式是 "题目内容,题目类型,答案"
          // 我们只取第一个逗号之前的部分作为题目内容
          const pureQuestion = question.split(',')[0];
          previewWindow.document.write(`<li>${pureQuestion}</li>`);
        });
        previewWindow.document.write('</ul>');
        previewWindow.document.close();
      }
    })
    .catch(error => {
      console.error('预览试卷失败:', error);
      alert('预览试卷失败，请稍后再试。');
    });
}