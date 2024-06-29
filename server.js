const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const app = express();
const port = 3000;

// 创建数据库连接
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'mysystem',
  authProtocol: 'mysql_native_password'
});

// 连接到MySQL服务器
connection.connect();
// 定义用户数据文件路径和题目文件的路径并确保data文件夹存在
const userFilePath = path.join(__dirname, 'data', 'user.txt');
const questionBasePath = path.join(__dirname, 'data');
const userDataDir = path.join(__dirname, 'data');
if (!fs.existsSync(userDataDir)) {
  fs.mkdirSync(userDataDir);
}
let openQuestionFiles = {}; // 存储打开的文件描述符（句柄）

// 允许跨域请求，解析JSON格式的请求体
app.use(cors());
app.use(bodyParser.json());

/*****************************************相关检查*************************************************/
// 检查用户名是否合法
function isValidUsername(username) {
  return typeof username === 'string' && username.length <= 10;
}
// 检查用户名是否存在于MySQL数据库中
function isUsernameExists(username) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT 1 FROM users WHERE username = ? LIMIT 1';
    connection.query(query, [username], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(!!results.length); // 如果结果数组长度大于0，表示用户名存在
      }
    });
  });
}
/*****************************************相关检查*************************************************/

/****************************************注册API端点**********************************************/
app.post('/register', async (req, res) => {
  const userInfo = req.body;
  const { username, password, role } = userInfo;

  // 检查用户名是否合法
  if (!isValidUsername(username)) {
    return res.status(400).json({ error: '用户名不合法' });
  }

  // 检查用户名是否存在于MySQL数据库中
  try {
    const exists = await isUsernameExists(username);
    if (exists) {
      return res.status(409).json({ error: '用户名已存在' });
    }
  } catch (err) {
    console.error('检查用户名时发生错误:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }

  // 用户名不存在，执行注册操作
  try {
    if (role === 'teacher') {
      const questionFilePath = path.join(__dirname, 'data', username + 'Question.txt');
      if (!fs.existsSync(path.dirname(questionFilePath))) {
          fs.mkdirSync(path.dirname(questionFilePath));
      }
      fs.writeFileSync(questionFilePath, ''); // 创建空文件
    }
    const query = `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`;
    await new Promise((resolve, reject) => {
      connection.query(query, [username, password, role], (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
    res.json({ message: '注册成功' });
  } catch (err) {
    console.error('数据库操作失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});
/****************************************注册API端点**********************************************/

/****************************************登录API端点***********************************************/
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    fs.readFile(userFilePath, 'utf8', (err, data) => {// 读取user.txt文件并验证用户名和密码
      if (err) {
        console.error('读取文件失败:', err);
        return res.status(500).json({ error: '服务器内部错误' });
      }
      const users = data.split('\n');
      const user = users.find(userStr => {
        try {
          const userInfo = JSON.parse(userStr);
          return userInfo.username === username && userInfo.password === password;
        } catch (e) {
          return false;
        }
      });
      if (!user) {
        return res.json({ error: '用户名或密码错误' });
      }
      const userInfo = JSON.parse(user); // 登录成功，返回用户角色
      res.json({ role: userInfo.role, username: userInfo.username });// 登录验证成功后返回用户角色，用户名
    });
});
// 保存题目API端点，使用持久化文件句柄
app.post('/saveQuestion', (req, res) => {
    const { question, type, answer, teacherUsername } = req.body;
    const questionFilePath = path.join(questionBasePath, teacherUsername + 'Question.txt');
    const questionData = `${question},${type},${answer}\n`;
    let fileDescriptor;
    // 检查文件句柄是否已经打开
    if (openQuestionFiles[teacherUsername]) {
      fileDescriptor = openQuestionFiles[teacherUsername];
    } else {
      // 如果没有打开，则打开文件并存储文件句柄
      fileDescriptor = fs.openSync(questionFilePath, 'a');//以追加模式'a'打开文件，这样每次写入时都会自动在现有内容之后添加内容
      openQuestionFiles[teacherUsername] = fileDescriptor;
    }
    fs.appendFile(fileDescriptor, questionData, (err) => {
      if (err) {
        console.error('保存题目失败:', err);
        return res.status(500).json({ error: '服务器内部错误' });
      }
      res.json({ message: '题目保存成功' });
    });
  });
/****************************************登录API端点***********************************************/

/**************************************题库管理API端点***********************************************/
app.post('/editQuestion', (req, res) => {// 编辑题目API端点
    const { originalIndex, newQuestion, newType, newAnswer, teacherUsername } = req.body;
    const questionFilePath = path.join(__dirname, 'data', teacherUsername + 'Question.txt');
    fs.readFile(questionFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('读取文件失败:', err);
            return res.status(500).json({ error: '服务器内部错误' });
        }
        let lines = data.split('\n').map(line => line.trim()); // 去除每行的首尾空白字符
        lines[originalIndex] = `${newQuestion},${newType},${newAnswer}`; //替换指定行
        fs.writeFile(questionFilePath, lines.join('\n'), (err) => {
            if (err) {
                console.error('编辑题目失败:', err);
                return res.status(500).json({ error: '服务器内部错误' });
            }
            res.json({ message: '题目编辑成功' });
        });
    });
});

app.post('/deleteQuestion', (req, res) => {// 删除题目API端点
    const { index, teacherUsername } = req.body;
    const questionFilePath = path.join(__dirname, 'data', teacherUsername + 'Question.txt');
    fs.readFile(questionFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('读取文件失败:', err);
            return res.status(500).json({ error: '服务器内部错误' });
        }
        let lines = data.split('\n').map(line => line.trim()); // 去除每行的首尾空白字符
        lines.splice(index, 1); // 删除指定行
        lines = lines.filter(line => line); // 过滤掉空行
        if (lines.length > 0) {
         lines[lines.length - 1] += '\n'; // 确保最后一个条目后面有换行符
        }
        fs.writeFile(questionFilePath, lines.join('\n'), (err) => {
            if (err) {
                console.error('删除题目失败:', err);
                return res.status(500).json({ error: '服务器内部错误' });
            }
            res.json({ message: '题目删除成功' });
        });
    });
});

app.get('/getQuestions', (req, res) => {// 获取当前老师的题库数据API端点
    const { teacherUsername } = req.query;
    const questionFilePath = path.join(questionBasePath, teacherUsername + 'Question.txt');
    fs.readFile(questionFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('读取题库数据失败:', err);
        return res.status(500).json({ error: '服务器内部错误' });
      }
      const questions = data.split('\n').filter(line => line.trim() !== '').map(line => {  // 过滤掉空行
        const [question, type, answer] = line.split(',');
        return { question, type, answer };
      });
      res.json(questions);
    });
  });
  // 服务器关闭时，关闭所有文件句柄
  process.on('exit', () => {
    Object.keys(openQuestionFiles).forEach(teacherUsername => {
      fs.closeSync(openQuestionFiles[teacherUsername]);
    });
  });
/**************************************题库管理API端点***********************************************/

/***************************************管理员API端点***********************************************/
app.get('/getAllQuestions', (req, res) => {
  const questionBasePath = path.join(__dirname, 'data');
  const files = fs.readdirSync(questionBasePath); // 同步读取文件列表
  const questionsData = [];
  let filesCount = files.filter(file => file.endsWith('Question.txt')).length; // 计算文件数量
  let filesProcessed = 0;

  files.forEach(file => {
    if (file.endsWith('Question.txt')) {
      const teacherUsername = path.basename(file, 'Question.txt');
      const questionFilePath = path.join(questionBasePath, file);
      const data = fs.readFileSync(questionFilePath, 'utf8'); // 同步读取文件内容
      const questions = data.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const [question, type, answer] = line.split(',');
          return { question, type, answer };
        });
      questionsData.push({ teacherUsername, questions });
      filesProcessed++;
      if (filesProcessed === filesCount) {
        res.json(questionsData); // 所有文件处理完毕后发送响应
      }
    }
  });
});
/***************************************管理员API端点***********************************************/

/****************************************新建测验API端点**********************************************/
app.post('/saveExam', (req, res) => {
    const { examName, examType, questions } = req.body;
    const examFilePath = path.join(__dirname, 'data', `${examName}_practice.txt`);
    fs.writeFile(examFilePath, questions+ '\n', (err) => {
        if (err) {
            console.error('创建试卷失败:', err);
            return res.status(500).json({ success: false, error: '服务器内部错误' }); // 确保响应是 JSON 格式
        }
        res.json({ success: true }); // 确保发送成功的响应也是 JSON 格式
    });
});
/****************************************新建试卷API端点**********************************************/

/**************************************** 加入试卷API端点 **********************************************/
app.post('/joinExam', (req, res) => {
  const { examName, questions } = req.body;
  const examFilePath = path.join(__dirname, 'data', examName + '.txt');

  // 读取现有试卷内容
  fs.readFile(examFilePath, 'utf8', (err, existingContent) => {
    if (err && err.code !== 'ENOENT') { // 如果文件存在，ENOENT是预期的，其他错误则不是
      console.error('读取现有试卷失败:', err);
      return res.status(500).json({ success: false, error: '服务器内部错误' });
    }
    // 如果文件存在，将新题目添加到文件末尾
    const newContent = existingContent ? existingContent + questions : questions;
    // 写入更新后的内容到试卷文件
    fs.writeFile(examFilePath, newContent+ '\n', (err) => {
      if (err) {
        console.error('更新试卷失败:', err);
        return res.status(500).json({ success: false, error: '服务器内部错误' });
      } else {
        res.json({ success: true }); // 发送成功的响应
      }
    });
  });
});
/**************************************** 加入试卷API端点 **********************************************/

/**************************************** 试卷预览API端点 **********************************************/
app.get('/previewExam', (req, res) => {
  const { examName } = req.query;
  if (!examName) {
    return res.status(400).json({ error: '缺少试卷名称' });
  }
  const examFilePath = path.join(__dirname, 'data', `${examName}_practice.txt`);
  fs.readFile(examFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('读取试卷失败:', err);
      return res.status(500).json({ error: '服务器内部错误' });
    }
    // 处理数据，只返回题目部分，并添加序号
    const questions = data.split('\n')
  .filter(line => line.trim() !== '')
  .map((line, index) => {
    // 添加序号，并返回处理后的题目字符串
    return `${index + 1}. ${line}`;
  });
res.json({ questions });
  });
});
/**************************************** 试卷预览API端点 **********************************************/

app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});