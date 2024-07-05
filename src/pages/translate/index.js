import React, { useState } from 'react';
import { Input, Select, Button, Layout, Form, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { saveAs } from 'file-saver';

const { TextArea } = Input;
const { Option } = Select;
const { Content } = Layout;

const Translate = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('zh');
  const [file, setFile] = useState(null);

  const translateText = async () => {
    try {
      const response = await axios.post('http://localhost:3001/translate', {
        text: inputText,
        sourceLang,
        targetLang,
      });

      setOutputText(response.data.translations[0].text);
    } catch (error) {
      setOutputText('翻译失败，请检查您的输入和 API 密钥。');
    }
  };

  const handleFileUpload = (file) => {
    setFile(file);
    return false; // Prevent automatic upload
  };

  const translateDocument = async () => {
    if (!file) {
      message.error('请上传文件');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceLang', sourceLang);
    formData.append('targetLang', targetLang);

    try {
      const response = await axios.post('http://localhost:3001/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { document_id, document_key } = response.data;
      pollDocumentTranslation(document_id, document_key);
    } catch (error) {
      message.error('文件上传失败，请检查您的 API 密钥。');
    }
  };

  const pollDocumentTranslation = async (documentId, documentKey) => {
    try {
      const response = await axios.get(`http://localhost:3001/document/${documentId}`, {
        params: {
          document_key: documentKey,
        },
      });

      if (response.data.status === 'done') {
        downloadTranslatedDocument(documentId, documentKey);
      } else if (response.data.status === 'translating') {
        setTimeout(() => pollDocumentTranslation(documentId, documentKey), 5000);
      } else {
        message.error('文件翻译失败，请稍后再试。');
      }
    } catch (error) {
      message.error('获取翻译状态失败，请检查您的 API 密钥。');
    }
  };

  const downloadTranslatedDocument = async (documentId, documentKey) => {
    try {
      const response = await axios.get(`http://localhost:3001/document/${documentId}/result`, {
        responseType: 'blob',
        params: {
          document_key: documentKey,
        },
      });

      saveAs(response.data, file.name);
      message.success('文件翻译成功并已下载。');
    } catch (error) {
      message.error('文件下载失败，请检查您的 API 密钥。');
    }
  };

  return (
    <Layout style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Content>
        <h1>实时翻译</h1>
        <TextArea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="输入文本..."
          style={{ marginBottom: '20px' }}
        />
        <Form layout="inline" style={{ marginBottom: '20px' }}>
          <Form.Item label="源语言">
            <Select
              value={sourceLang}
              onChange={value => setSourceLang(value)}
              style={{ width: 120, marginRight: 10 }}
            >
              <Option value="en">英语</Option>
              <Option value="zh">中文</Option>
              <Option value="de">德语</Option>
              <Option value="fr">法语</Option>
            </Select>
          </Form.Item>
          <Form.Item label="目标语言">
            <Select
              value={targetLang}
              onChange={value => setTargetLang(value)}
              style={{ width: 120, marginRight: 10 }}
            >
              <Option value="zh">中文</Option>
              <Option value="en">英语</Option>
              <Option value="de">德语</Option>
              <Option value="fr">法语</Option>
            </Select>
          </Form.Item>
        </Form>
        <Button type="primary" onClick={translateText} style={{ marginRight: '10px' }}>
          翻译
        </Button>
        <Upload beforeUpload={handleFileUpload} showUploadList={false}>
          <Button icon={<UploadOutlined />}>上传文件</Button>
        </Upload>
        <Button type="primary" onClick={translateDocument} style={{ marginLeft: '10px' }}>
          翻译文件
        </Button>
        <div id="output" style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px', minHeight: '100px' }}>
          {outputText}
        </div>
      </Content>
    </Layout>
  );
};

export default Translate;
