const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer'); // 引入 multer 以处理文件上传
const FormData = require('form-data'); // 引入 form-data 包

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

const apiKey = '019e513a-879a-4313-8d5e-37963d93b95c:fx'; // 替换为你的 DeepL API 密钥

// 配置 multer 以处理文件上传
const storage = multer.memoryStorage(); // 将文件存储在内存中
const upload = multer({ storage: storage });

app.post('/translate', async (req, res) => {
  const { text, sourceLang, targetLang } = req.body;

  try {
    const response = await axios.post('https://api-free.deepl.com/v2/translate', null, {
      params: {
        auth_key: apiKey,
        text,
        source_lang: sourceLang.toUpperCase(),
        target_lang: targetLang.toUpperCase(),
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).send('翻译失败');
  }
});

// 使用 multer 处理文件上传
app.post('/document', upload.single('file'), async (req, res) => {
  const file = req.file; // 使用 req.file 获取上传的文件对象
  const { sourceLang, targetLang } = req.body;

  // 使用 FormData
  const formData = new FormData();
  formData.append('auth_key', apiKey);
  formData.append('file', file.buffer, file.originalname); // 使用 file.buffer 和 file.originalname
  formData.append('source_lang', sourceLang.toUpperCase());
  formData.append('target_lang', targetLang.toUpperCase());

  try {
    const response = await axios.post('https://api-free.deepl.com/v2/document', formData, {
      headers: formData.getHeaders(),
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).send('文档上传失败');
  }
});

app.get('/document/:id', async (req, res) => {
  const { id } = req.params;
  const { document_key } = req.query; // 从查询参数中获取 document_key

  if (!document_key) {
    return res.status(400).send('缺少 document_key');
  }

  try {
    const response = await axios.get(`https://api-free.deepl.com/v2/document/${id}`, {
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
      },
      params: {
        document_key: document_key,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('获取文档翻译状态失败:', error);
    res.status(500).send('获取文档翻译状态失败');
  }
});

app.get('/document/:id/result', async (req, res) => {
  const { id } = req.params;
  const { document_key } = req.query; // 从查询参数中获取 document_key

  if (!document_key) {
    return res.status(400).send('缺少 document_key');
  }

  try {
    const response = await axios.get(`https://api-free.deepl.com/v2/document/${id}/result`, {
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
      },
      responseType: 'stream',
      params: {
        document_key: document_key,
      },
    });
    response.data.pipe(res);
  } catch (error) {
    console.error('下载文档失败:', error);
    res.status(500).send('下载文档失败');
  }
});

app.listen(port, () => {
  console.log(`代理服务器运行在 http://localhost:${port}`);
});
