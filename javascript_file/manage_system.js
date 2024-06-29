window.addEventListener('load', function() {
  var teacherUsername = localStorage.getItem('currentTeacherUsername');
  if (teacherUsername) { // 如果已经登录并且存在用户名
    reloadQuestionBank(teacherUsername); // 加载题库
  }
});

function addRow(TYPE) {
  var table = document.getElementById("table");
  var length = table.rows.length;
  var newRow = table.insertRow(length);
  var cellIndex = newRow.insertCell(0);
  var cellQuestion = newRow.insertCell(1);
  var cellType = newRow.insertCell(2);
  var cellAnswer = newRow.insertCell(3);
  var cellAction = newRow.insertCell(4);
  cellIndex.innerHTML = length;
  cellQuestion.innerHTML = "请输入题目";
  if (TYPE == "简答"){
    cellType.innerHTML = "简答";
  }
  else if (TYPE == "填空")
  {
    cellType.innerHTML = "填空";
  }
  else if (TYPE == "选择")
  {
    cellType.innerHTML = "选择";
  }
  cellAnswer.innerHTML = "请输入答案";
  cellAction.innerHTML = "<button onclick='editRow(this)'>编辑</button> <button onclick='deleteRow(this)'>删除</button>";
  saveQuestion("请输入题目", TYPE, "请输入答案");// 调用保存题目
}

function deleteRow(button) {
  var row = button.parentNode.parentNode;
  var index = row.cells[0].innerHTML - 1;//将前端序号减1后传递给后端
  var teacherUsername = localStorage.getItem('currentTeacherUsername'); // 使用当前老师的用户名
  if (confirm("确定要删除吗？")) {
    fetch('http://localhost:3000/deleteQuestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ index, teacherUsername })
    })
    .then(response => response.json())
    .then(data => {
      row.parentNode.removeChild(row);
      alert('题目删除成功');
      reloadQuestionBank(teacherUsername); // 删除后重新加载题库
    })
    .catch(error => {
      console.error('删除题目失败:', error);
      alert('题目删除失败，请稍后再试。');
    });
  }
}

function editRow(button) {
  var row = button.parentNode.parentNode;
  var cellQuestion = row.cells[1];
  var cellType = row.cells[2];
  var cellAnswer = row.cells[3];
  var originalIndex = row.cells[0].innerHTML;
  var newQuestion = prompt("请输入题目", cellQuestion.innerHTML);
  // var newType = prompt("请输入题目类型", cellType.innerHTML);
  var newType = cellType.innerHTML
  var newAnswer = prompt("请输入答案", cellAnswer.innerHTML);
  if (newQuestion) cellQuestion.innerHTML = newQuestion;
  // if (newType) cellType.innerHTML = newType;
  if (newAnswer) cellAnswer.innerHTML = newAnswer;
  var teacherUsername = localStorage.getItem('currentTeacherUsername'); // 使用当前老师的用户名
  editQuestion(originalIndex - 1, newQuestion, newType, newAnswer, teacherUsername);//将前端序号减1后传递给后端。
}

function editQuestion(originalIndex, newQuestion, newType, newAnswer, teacherUsername) {
  fetch('http://localhost:3000/editQuestion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ originalIndex, newQuestion, newType, newAnswer, teacherUsername })
  })
  .then(response => response.json())
  .then(data => {
    alert('题目编辑成功');
    reloadQuestionBank(teacherUsername); // 编辑后重新加载题库
  })
  .catch(error => {
    console.error('编辑题目失败:', error);
    alert('题目编辑失败，请稍后再试。');
  });
}

function saveQuestion(question, type, answer) {
  var teacherUsername = localStorage.getItem('currentTeacherUsername'); //使用当前老师的用户名
  fetch('http://localhost:3000/saveQuestion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question, type, answer, teacherUsername })
  })
  .then(response => response.json())
  .then(data => {
    alert('题目保存成功');
  })
  .catch(error => {
    console.error('保存题目失败:', error);
    alert('题目保存失败，请稍后再试。');
  });
}
//重新加载当前老师的题库
function reloadQuestionBank(teacherUsername) {
  var storedTeacherUsername = localStorage.getItem('currentTeacherUsername');
  fetch(`http://localhost:3000/getQuestions?teacherUsername=${storedTeacherUsername}`)
  .then(response => response.json())
  .then(data => {
    var table = document.getElementById("table");
    while (table.rows.length > 1) {   //清空现有数据除了表头
      table.deleteRow(1);
    }
    //重新加载数据
    data.forEach((question, index) => {
      addRowWithData(index, question.question, question.type, question.answer);
    });
  })
  .catch(error => {
    console.error('重新加载题库失败:', error);
    alert('重新加载题库失败，请稍后再试。');
  });
}

//辅助函数，用于添加带有数据的行
function addRowWithData(index, question, type, answer) {
  var table = document.getElementById("table");
  var newRow = table.insertRow(-1);
  var cellIndex = newRow.insertCell(0);
  var cellQuestion = newRow.insertCell(1);
  var cellType = newRow.insertCell(2);
  var cellAnswer = newRow.insertCell(3);
  var cellAction = newRow.insertCell(4);
  cellIndex.innerHTML = index + 1; // 序号从1开始
  cellQuestion.innerHTML = question;
  cellType.innerHTML = type;
  cellAnswer.innerHTML = answer;
  cellAction.innerHTML = "<button onclick='editRow(this)'>编辑</button> <button onclick='deleteRow(this)'>删除</button>";
}
function publish() {
  window.open("..\\publish.html")
}