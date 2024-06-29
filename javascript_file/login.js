var currentTeacherUsername = null;//全局变量
var currentStudentUsername = null;
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = {
      username: document.getElementById('username').value,
      password: document.getElementById('password').value
    };
    
    fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert('登录失败：' + data.error);
      } else {
        alert('登录成功！');
        if (data.role === 'teacher') {
            // 登录成功后存储用户名
            localStorage.setItem('currentTeacherUsername', data.username);
            window.open("..\\manage_system.html");
        } else {
       
           if (data.role === 'admin') {
             window.open("..\\admin.html");
           } 
            if (data.role === 'student') {
              localStorage.setItem('currentStudentUsername', data.username);
              window.open("..\\student.html");
           } 
         }
      }
    })
    .catch(error => {
      console.error('登录失败:', error);
      alert('登录失败，请稍后再试。');
    });
  });