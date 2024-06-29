const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
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
// 检查用户名是否合法
function isValidUsername(username) {
  return typeof username === 'string' && username.length <= 10;
}
/****************************************注册API端点***********************************************/
app.post('/register', async (req, res) => {
  const userInfo = req.body;
  const { username, password, role } = userInfo;
  const dataFolderPath = path.join(__dirname, 'data');
  const userFilePath = path.join(dataFolderPath, 'user.txt'); //用户记录存储在这个文件
  if (!isValidUsername(username)) {
    return res.status(400).json({ error: '用户名不合法' });
  }
  let userFolderPath;
  if (role === 'student') {
    userFolderPath = path.join(dataFolderPath, username + '_stu');
  } else if (role === 'teacher') {
    userFolderPath = path.join(dataFolderPath, username + '_tea');
  } else if (role === 'admin') {
    userFolderPath = path.join(dataFolderPath, username + '_adm');
  }
  try {
    await new Promise((resolve, reject) => {
      fs.mkdir(userFolderPath, (err) => {
        if (err) {
          if (err.code === 'EEXIST') {
            reject(new Error('用户名已存在'));
          } else {
            reject(new Error('创建文件夹失败'));
          }
        } else {
          console.log(`文件夹 ${userFolderPath} 已创建`);
          resolve();
        }
      });
    });
    if (role === 'teacher') {
      const questionFilePath = path.join(__dirname, 'data', username + 'Question.txt');
      fs.writeFileSync(questionFilePath, ''); // 创建空文件
    }
    const data = JSON.stringify(userInfo) + '\n'; // 添加换行符以分隔每条记录
    await new Promise((resolve, reject) => {
      fs.writeFile(userFilePath, data, { flag: 'a+' }, (err) => {
        if (err) {
          reject(new Error('写入文件失败'));
        } else {
          res.json({ message: '注册成功' });
          resolve();
        }
      });
    });
  } catch (err) {
    console.error(err);
    if (err.message === '用户名已存在') {
      return res.status(409).json({ error: err.message });
    } else {
      return res.status(500).json({ error: '服务器内部错误' });
    }
  }
});
//服务器用GET找到当前目录下的 register.html 文件，并将这个HTML文件作为响应发送给客户端
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});
/****************************************注册API端点***********************************************/

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
      fileDescriptor = fs.openSync(questionFilePath, 'a');//这样每次写入时都会自动在现有内容之后添加内容
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
app.post('/editQuestion', (req, res) => {//编辑题目API端点
    const { originalIndex, newQuestion, newType, newAnswer, teacherUsername } = req.body;
    const questionFilePath = path.join(__dirname, 'data', teacherUsername + 'Question.txt');
    fs.readFile(questionFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('读取文件失败:', err);
            return res.status(500).json({ error: '服务器内部错误' });
        }
        let lines = data.split('\n').map(line => line.trim()); //去除每行的首尾空白字符
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

app.post('/deleteQuestion', (req, res) => {//删除题目API端点
    const { index, teacherUsername } = req.body;
    const questionFilePath = path.join(__dirname, 'data', teacherUsername + 'Question.txt');
    fs.readFile(questionFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('读取文件失败:', err);
            return res.status(500).json({ error: '服务器内部错误' });
        }
        let lines = data.split('\n').map(line => line.trim()); //去除每行的首尾空白字符
        lines.splice(index, 1); //删除指定行
        lines = lines.filter(line => line); //删除空行
        if (lines.length > 0) {
         lines[lines.length - 1] += '\n'; //确保最后一个条目后面有换行符
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
      const questions = data.split('\n').filter(line => line.trim() !== '').map(line => { 
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
  const files = fs.readdirSync(questionBasePath); 
  const questionsData = [];
  let filesCount = files.filter(file => file.endsWith('Question.txt')).length;
  let filesProcessed = 0;

  files.forEach(file => {
    if (file.endsWith('Question.txt')) {
      const teacherUsername = path.basename(file, 'Question.txt');
      const questionFilePath = path.join(questionBasePath, file);
      const data = fs.readFileSync(questionFilePath, 'utf8');
      const questions = data.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const [question, type, answer] = line.split(',');
          return { question, type, answer };
        });
      questionsData.push({ teacherUsername, questions });
      filesProcessed++;
      if (filesProcessed === filesCount) {
        res.json(questionsData); 
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
            return res.status(500).json({ success: false, error: '服务器内部错误' }); 
        }
        res.json({ success: true }); 
    });
});
/****************************************新建试卷API端点**********************************************/

/**************************************** 加入试卷API端点 **********************************************/
app.post('/joinExam', (req, res) => {
  const { examName, questions } = req.body;
  const examFilePath = path.join(__dirname, 'data', examName + '.txt');
  // 读取现有试卷内容
  fs.readFile(examFilePath, 'utf8', (err, existingContent) => {
    if (err && err.code !== 'ENOENT') { 
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
        res.json({ success: true }); 
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
    const questions = data.split('\n')
  .filter(line => line.trim() !== '')
  .map((line, index) => {
    return `${index + 1}. ${line}`; // 添加序号并返回处理后的题目字符串
  });
res.json({ questions });
  });
});
/**************************************** 试卷预览API端点 **********************************************/

/**************************************** 获取试卷列表API端点 **********************************************/
app.get('/getExamList', (req, res) => {
  const studentUsername = req.query.studentUsername;
  const questionstupath = path.join(questionBasePath, studentUsername + '_stu'); // 基于学生用户名动态生成路径
  fs.readdir(questionstupath, (err, files) => {
    if (err) {
      console.error('读取文件列表失败:', err);
      return res.status(500).json({ error: '服务器内部错误' });
    }
    const exams = files.filter(file => file.endsWith('_practice.txt')).map(file => {
      return { name: path.basename(file, '_practice.txt') };
    });
    res.json(exams);
  });
});
/**************************************** 获取试卷列表API端点 **********************************************/

/******************************************考试预处理API端点************************************************/
app.post('/prepareExam', (req, res) => {
  const { examName, studentUsername } = req.body; // 获取考试名称和学生用户名
  const questionstupath = path.join(questionBasePath, studentUsername + '_stu'); // 动态生成路径
  const practiceFilePath = path.join(questionstupath, `${examName}_practice.txt`);
  const answerFilePath = path.join(questionstupath, `${examName}_practiceAnswer.txt`);
  fs.access(practiceFilePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: '试卷文件不存在' });
    }
    fs.readFile(practiceFilePath, 'utf8', (err, data) => {
      if (err) {
        return res.status(500).json({ error: '读取试卷文件失败' });
      }
      fs.stat(answerFilePath, (err, stats) => {
        if (!err && stats.size > 0) { // 如果答案文件存在且不为空，则视为已经提交
          return res.status(500).json({ error: '试卷已经提交，不能重复作答' });
        } else {
          let lines = data.trim().split('\n').map(line => {
            const [question, type, answer] = line.split(',');
            return `${question},${type},${answer},null`; // 添加null作为未作答标记
          });
          const answerData = lines.join('\n') + '\n'; // 确保最后一个条目后面有换行符
          fs.writeFile(answerFilePath, answerData, (err) => {
            if (err) {
              return res.status(500).json({ error: '创建答案文件失败' });
            }
            const endTime = new Date(new Date().getTime() + 3600000); // 考试时间为1小时
            res.json({ message: '答案文件已创建', endTime: endTime.toISOString() }); // 发送成功的响应和考试结束时间
          });
        }
      });
    });
  });
});
/******************************************考试预处理API端点************************************************/

/**************************************** 加载题目API端点 **********************************************/
app.get('/loadQuestions', (req, res) => {
  const { examName } = req.query;
  const studentUsername = req.query.studentUsername; 
  const questionFilePath = path.join(questionBasePath, studentUsername + '_stu', `${examName}_practiceAnswer.txt`);
  fs.readFile(questionFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('读取题目失败:', err);
      return res.status(500).json({ error: '服务器内部错误' });
    }
    const questions = data.split('\n')
      .filter(line => line.trim() !== '')
      .map((line, index) => {
        const [question, type] = line.split(',');
        return { index: index + 1, question, type };
      });
    res.json(questions);
  });
});
/**************************************** 加载题目API端点 **********************************************/

/**************************************** 更新答案API端点 **********************************************/
app.post('/updateAnswer', (req, res) => {
  const { examName, index, newAnswer } = req.body;
  const studentUsername = req.body.studentUsername; 
  const answerFilePath = path.join(questionBasePath, studentUsername + '_stu', `${examName}_practiceAnswer.txt`);

  fs.readFile(answerFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('读取答案文件失败:', err);
      return res.status(500).json({ success: false, error: '服务器内部错误' });
    }
    let lines = data.split('\n').map(line => line.trim()); // 去除每行的首尾空白字符
    // 检查题目序号是否有效
    if (index > 0 && index <= lines.length) {
      lines[index - 1] = lines[index - 1].replace(/null$/, newAnswer); // 更新答案
      fs.writeFile(answerFilePath, lines.join('\n'), (err) => {
        if (err) {
          console.error('更新答案失败:', err);
          return res.status(500).json({ success: false, error: '服务器内部错误' });
        }
        res.json({ success: true }); // 发送成功的响应
      });
    } else {
      return res.status(400).json({ success: false, error: '无效的题目索引' });
    }
  });
});
/**************************************** 更新答案API端点 **********************************************/

/****************************************获取待批改列表API端点 **********************************************/
app.get('/correctExamList', (req, res) => {
  const questionBasePath = path.join(__dirname, 'data');
  const publishedPath = path.join(questionBasePath, 'stu1_stu');
  fs.readdir(publishedPath, (err, files) => {
    if (err) {
      console.error('读取文件列表失败:', err);
      return res.status(500).json({ error: '服务器内部错误' });
    }
    const exams = files.filter(file => file.endsWith('_practiceAnswer.txt')).map(file => {
      return { name: path.basename(file, '_practiceAnswer.txt') };
    });
    res.json(exams);
  });
});
/****************************************获取待批改列表API端点 **********************************************/

/**************************************** 准备批改API端点 **********************************************/
app.post('/prepareCorrection', (req, res) => {
  const { examName } = req.body;
  const questionBasePath = path.join(__dirname, 'data', 'stu1_stu');
  const sourceFilePath = path.join(questionBasePath, `${examName}_practiceAnswer.txt`);
  const targetFileName = `${examName}_practiceAnswerCorrect.txt`;
  const targetFilePath = path.join(questionBasePath, targetFileName);

  fs.access(targetFilePath, fs.constants.F_OK, (err) => {  // 检查目标文件是否存在
    if (err) {
      // 文件不存在，执行复制和添加null的操作
      fs.copyFile(sourceFilePath, targetFilePath, (copyErr) => {
        if (copyErr) {
          console.error('复制文件失败:', copyErr);
          return res.status(500).json({ success: false });
        }
        // 读取复制的文件内容并添加,null
        fs.readFile(targetFilePath, 'utf8', (readErr, data) => {
          if (readErr) {
            console.error('读取文件失败:', readErr);
            return res.status(500).end();
          }
          let lines = data.trim().split('\n').filter(line => line.trim() !== '');// 分割文件内容为行并过滤掉空行
          lines = lines.map(line => line + ',null'); // 在每一行的末尾添加null
          // 确保文件以空行结尾
          if (!lines.length || lines[lines.length - 1].trim() !== '') {
            lines.push('');
          }
          // 写回修改后的内容
          let modifiedData = lines.join('\n') ;
          fs.writeFile(targetFilePath, modifiedData, (writeErr) => {
            if (writeErr) {
              console.error('写入文件失败:', writeErr);
              return res.status(500).end();
            }
            res.json({ success: true });
          });
        });
      });
    } else {  
      res.json({ success: true, message: '你已经批改过了' });// 文件已存在，在浏览器窗口中提示用户
    }
  });
});
/**************************************** 准备批改API端点 **********************************************/

/**************************************** 加载批改题目API端点 **********************************************/
app.get('/loadCorrectQuestions', (req, res) => {
  const { examName } = req.query;
  const questionBasePath = path.join(__dirname, 'data', 'stu1_stu');
  const correctFilePath = path.join(questionBasePath, `${examName}_practiceAnswerCorrect.txt`);
  fs.readFile(correctFilePath, 'utf8', (err, data) => {
      if (err) {
          console.error('读取批改信息失败:', err);
          return res.status(500).json({ error: '服务器内部错误' });
      }
      const questions = data.split('\n')
          .filter(line => line.trim() !== '')
          .map((line) => {
              const details = line.split(',').map(detail => detail.trim());
              return details;
          });
      res.json(questions);
  });
});
/**************************************** 加载批改题目API端点 **********************************************/

/**************************************** 更新批改结果API端点 **********************************************/
app.post('/correctAnswer', (req, res) => {
  const { examName, index, correctionResult } = req.body;
  const questionBasePath = path.join(__dirname, 'data', 'stu1_stu');
  const correctFilePath = path.join(questionBasePath, `${examName}_practiceAnswerCorrect.txt`);

  fs.readFile(correctFilePath, 'utf8', (err, data) => {
      if (err) {
          console.error('读取批改信息失败:', err);
          return res.status(500).json({ success: false, error: '服务器内部错误' });
      }
      let lines = data.split('\n').map(line => line.trim());
      if (index > 0 && index <= lines.length) {
          lines[index - 1] = lines[index - 1].substring(0, lines[index - 1].lastIndexOf(',')) + `,${correctionResult}`;
          fs.writeFile(correctFilePath, lines.join('\n'), (err) => {
              if (err) {
                  console.error('更新批改结果失败:', err);
                  return res.status(500).json({ success: false, error: '服务器内部错误' });
              }
              res.json({ success: true }); // 发送成功的响应
          });
      } else {
          return res.status(400).json({ success: false, error: '无效的题目索引' });
      }
  });
});
/**************************************** 更新批改结果API端点 **********************************************/

/**************************************** 获取错题回顾列表API端点 **********************************************/
app.get('/requeList', (req, res) => {
  const questionBasePath = path.join(__dirname, 'data');
  const nowPath = path.join(questionBasePath, 'stu1_stu')
  fs.readdir(nowPath, (err, files) => {
      if (err) {
          console.error('读取文件列表失败:', err);
          return res.status(500).json({ error: '服务器内部错误' });
      }
      const exams = files.filter(file => file.endsWith('_practiceAnswerCorrect.txt')).map(file => {
          return { name: path.basename(file, '_practice.txt') };
      });
      res.json(exams);
  });
});
  app.get('/getrequestion', (req, res) => {// 获取当前老师的题库数据API端点
    const { teacherUsername } = req.query;
    const questionFilePath = path.join(questionBasePath, teacherUsername + '_practiceAnswerCorrect.txt');
    fs.readFile(questionFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('读取题库数据失败:', err);
        return res.status(500).json({ error: '服务器内部错误' });
      }
      const questions = data.split('\n').filter(line => line.trim() !== '').map(line => {
        const [question, type, correctanswer, youanswer, result] = line.split(',');
        return { question, type, answer, correctanswer, youanswer, result};
      });
      res.json(questions);
    });
  });
/**************************************** 获取错题回顾列表API端点 **********************************************/

/**************************************** 获取未发布试卷列表API端点 **********************************************/
app.get('/getnpubExamList', (req, res) => {
  const questionBasePath = path.join(__dirname, 'data');
  const publishedPath = path.join(questionBasePath, 'stu1_stu');
  // 读取data文件夹中的所有文件
  fs.readdir(questionBasePath, (err, files) => {
    if (err) {
      console.error('读取文件列表失败:', err);
      return res.status(500).json({ error: '服务器内部错误' });
    }
    // 读取data/stu1文件夹中的所有文件
    fs.readdir(publishedPath, (err, publishedFiles) => {
      if (err) {
        console.error('读取已发布文件列表失败:', err);
        // 如果stu1文件夹不存在，我们认为没有文件被发布
        if (err.code === 'ENOENT') {
          publishedFiles = [];
        } else {
          return res.status(500).json({ error: '读取已发布文件列表失败' });
        }
      }
      // 筛选出未发布的文件
      const exams = files.filter(file => 
        file.endsWith('_practice.txt') &&
        !publishedFiles.includes(file)
      ).map(file => {
        return { name: path.basename(file, '_practice.txt') };
      });
      res.json(exams);
    });
  });
});
/**************************************** 获取未发布试卷列表API端点 **********************************************/

/**************************************** 试卷发布API端点 **********************************************/
app.post('/copyExamFile', (req, res) => {
  const { examName } = req.body;
  const questionBasePath = path.join(__dirname, 'data');
  const sourceFilePath = path.join(questionBasePath, `${examName}_practice.txt`);
  const targetFolderPath1 = path.join(questionBasePath, 'stu1_stu');
  const targetFilePath1 = path.join(targetFolderPath1, `${examName}_practice.txt`);
  const targetFolderPath2 = path.join(questionBasePath, 'stu2_stu');
  const targetFilePath2 = path.join(targetFolderPath2, `${examName}_practice.txt`);
  // 确保目标文件夹存在
  fs.mkdir(targetFolderPath1, { recursive: true }, (err) => {
    if (err) {
      console.error('创建文件夹失败:', err);
      return res.status(500).json({ success: false, error: '服务器内部错误' });
    }
    // 复制文件
    fs.copyFile(sourceFilePath, targetFilePath1, (err) => {
      if (err) {
        console.error('复制文件失败:', err);
        res.status(500).json({ success: false, error: '文件复制失败' });
      } else {
        //console.log(`发布成功`);
        //res.json({ success: true });
      }
    });
    fs.copyFile(sourceFilePath, targetFilePath2, (err) => {
      if (err) {
        console.error('复制文件失败:', err);
        res.status(500).json({ success: false, error: '文件复制失败' });
      } else {
        console.log(`发布成功`);
        res.json({ success: true });
      }
    });
  });
});
/**************************************** 试卷发布API端点 **********************************************/
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});