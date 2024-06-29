document.getElementById('registrationForm').addEventListener('submit', function(event) {
    event.preventDefault();
    // 获取表单数据
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var role = document.getElementById('role').value;
    // 检查用户名和密码是否为空
    if (!username || !password) {
        alert('用户名和密码不能为空，请填写完整。');
        return; // 终止提交
    }
    const formData = {
        username: username,
        password: password,
        role: role
    };
    fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                switch (response.status) {
                    case 400:
                        alert('注册失败：' + errorData.error);
                        break;
                    case 409:
                        alert('注册失败：' + errorData.error);
                        window.open("../register.html");
                        break;
                    case 500:
                        alert('注册失败：服务器内部错误，请稍后再试。');
                        break;
                    default:
                        alert('注册失败。');
                }
            });
        }
        return response.json();
    })
    .then(data => {
       // alert(data);
        if (data !='undefined'){
            alert('注册成功！');
            window.open("../login.html");
        }
    })
    .catch(error => {
        console.error('注册失败:', error);
        //alert('注册失败，请稍后再试。');
    });
});