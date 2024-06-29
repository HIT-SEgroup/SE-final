document.getElementById('registrationForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
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
            // 服务器返回了错误状态码
            return response.json().then(errorData => {
                // 根据服务器返回的错误信息进行处理
                switch (response.status) {
                    case 400:
                        alert('注册失败：' + errorData.error);
                        break;
                    case 409:
                        alert('注册失败：' + errorData.error);
                        break;
                    case 500:
                        alert('注册失败：服务器内部错误，请稍后再试。');
                        break;
                    default:
                        alert('注册失败：未知错误，请稍后再试。');
                }
                throw new Error(errorData.error); // 抛出错误以供可能的外部错误处理使用
            });
        }
        return response.json();
    })
    .then(data => {
        alert('注册成功！');
        window.open("../login.html"); ////////////////////////////////
    })
    .catch(error => {
        console.error('注册失败:', error);
        //alert('注册失败，请稍后再试。');
    });
});