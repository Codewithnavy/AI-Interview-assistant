import React, { useState, useEffect } from 'react';
import { Card, Upload, Button, Form, Input, message, Spin, Typography } from 'antd';
import { UploadOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { addCandidate, updateCandidate, startInterview } from '../store/slices/appSlice';
import { parseResume, ParsedResumeData } from '../utils/resumeParser';
import { Candidate } from '../types';
import ChatInterface from './ChatInterface';

const { Dragger } = Upload;
const { Text } = Typography;

const IntervieweeTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const { candidates, currentCandidateId } = useAppSelector(state => state.app);
  
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [form] = Form.useForm();
  
  const currentCandidate = candidates.find(c => c.id === currentCandidateId);
  const isProfileComplete = currentCandidate?.profileComplete;

  useEffect(() => {
    if (parsedData) {
      form.setFieldsValue({
        name: parsedData.name || '',
        email: parsedData.email || '',
        phone: parsedData.phone || '',
      });
    }
  }, [parsedData, form]);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size too large. Please upload a file smaller than 10MB.');
      }

      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx'].includes(fileExtension || '')) {
        throw new Error('Invalid file type. Please upload a PDF or DOCX file.');
      }

      const parsed = await parseResume(file);
      setParsedData(parsed);
      
      // Show what was extracted
      const extractedFields = [];
      if (parsed.name) extractedFields.push('Name');
      if (parsed.email) extractedFields.push('Email');
      if (parsed.phone) extractedFields.push('Phone');
      
      const extractedText = extractedFields.length > 0 
        ? `Extracted: ${extractedFields.join(', ')}`
        : 'No information automatically extracted';
      
      message.success(`Resume parsed successfully! ${extractedText}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to parse resume');
    } finally {
      setLoading(false);
    }
    return false; // Prevent default upload
  };

  const handleSubmitProfile = async (values: { name: string; email: string; phone: string }) => {
    if (!currentCandidate) {
      // Create new candidate
      const newCandidate: Omit<Candidate, 'id' | 'createdAt' | 'completedSessions' | 'profileComplete'> = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        resumeText: parsedData?.rawText,
      };
      dispatch(addCandidate(newCandidate));
    } else {
      // Update existing candidate
      dispatch(updateCandidate({
        id: currentCandidate.id,
        updates: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          resumeText: parsedData?.rawText,
        }
      }));
    }
    
    message.success('Profile saved successfully!');
  };

  const handleStartInterview = () => {
    if (currentCandidate && currentCandidate.profileComplete) {
      dispatch(startInterview(currentCandidate.id));
      message.success('Interview started!');
    }
  };

  if (currentCandidate && currentCandidate.currentSession) {
    return <ChatInterface candidateId={currentCandidate.id} />;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card title="Welcome to AI Interview Assistant" style={{ marginBottom: 24 }}>
        <p>Upload your resume and fill in your profile to start the interview process.</p>
        
        {!parsedData && (
          <div style={{ marginBottom: 24 }}>
            <h3>Step 1: Upload Resume</h3>
            <Dragger
              accept=".pdf,.docx"
              beforeUpload={handleFileUpload}
              showUploadList={false}
              style={{ marginBottom: 16 }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag resume file to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for PDF and DOCX files
              </p>
            </Dragger>
            {loading && <Spin />}
          </div>
        )}

        {parsedData && (
          <div>
            <h3>Step 2: Review & Complete Profile</h3>
            <div style={{ 
              background: '#f6ffed', 
              border: '1px solid #b7eb8f', 
              borderRadius: 6, 
              padding: 12, 
              marginBottom: 16 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>📄 Resume Parsed Successfully!</span>
                <Button 
                  size="small" 
                  onClick={() => setParsedData(null)}
                  style={{ color: '#52c41a', borderColor: '#52c41a' }}
                >
                  Upload Different Resume
                </Button>
              </div>
              <div style={{ marginTop: 8 }}>
                {parsedData.name && <div style={{ color: '#52c41a' }}>✓ Name: {parsedData.name}</div>}
                {parsedData.email && <div style={{ color: '#52c41a' }}>✓ Email: {parsedData.email}</div>}
                {parsedData.phone && <div style={{ color: '#52c41a' }}>✓ Phone: {parsedData.phone}</div>}
                {!parsedData.name && !parsedData.email && !parsedData.phone && (
                  <div style={{ color: '#faad14' }}>⚠️ No information automatically extracted. Please fill in manually.</div>
                )}
              </div>
            </div>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmitProfile}
              style={{ marginTop: 16 }}
            >
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter your full name"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Enter your email address"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter your phone number' }]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Enter your phone number"
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" size="large">
                  Save Profile
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}

        {isProfileComplete && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <h3>Ready to Start Interview!</h3>
            <p>Your profile is complete. Click below to begin the interview.</p>
            <Button
              type="primary"
              size="large"
              onClick={handleStartInterview}
              style={{ marginTop: 16 }}
            >
              Start Interview
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default IntervieweeTab;
