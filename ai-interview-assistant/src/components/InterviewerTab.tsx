import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, Tag, Typography, Modal, Descriptions, Progress, message } from 'antd';
import { SearchOutlined, EyeOutlined, UserOutlined, MailOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAppSelector } from '../hooks/useAppSelector';
import { Candidate, InterviewSession } from '../types';
import { generateEmailContent, sendEmail, downloadResultsAsPDF } from '../utils/emailService';

const { Title, Text } = Typography;
const { Search } = Input;

const InterviewerTab: React.FC = () => {
  const { candidates } = useAppSelector(state => state.app);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [searchText, setSearchText] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchText.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchText.toLowerCase()) ||
    candidate.phone.includes(searchText)
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreTag = (score: number) => {
    if (score >= 80) return <Tag color="green">Excellent</Tag>;
    if (score >= 70) return <Tag color="orange">Good</Tag>;
    return <Tag color="red">Needs Improvement</Tag>;
  };

  const handleSendEmail = async (candidate: Candidate, session: InterviewSession) => {
    setSendingEmail(true);
    try {
      const questions = session.questions.map(q => ({
        text: q.text,
        answer: q.answer || 'No answer provided',
        score: q.score || 0,
      }));

      const emailData = generateEmailContent(
        candidate.name,
        session.totalScore || 0,
        session.aiSummary || 'No summary available',
        questions
      );

      emailData.to = candidate.email;

      const success = await sendEmail(emailData);
      if (success) {
        message.success(`Email sent successfully to ${candidate.email}`);
      } else {
        message.error('Failed to send email');
      }
    } catch (error) {
      message.error('Error sending email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadResults = (candidate: Candidate, session: InterviewSession) => {
    const questions = session.questions.map(q => ({
      text: q.text,
      answer: q.answer || 'No answer provided',
      score: q.score || 0,
    }));

    downloadResultsAsPDF(
      candidate.name,
      session.totalScore || 0,
      session.aiSummary || 'No summary available',
      questions
    );
    message.success('Results downloaded successfully');
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Candidate, b: Candidate) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Completed Interviews',
      dataIndex: 'completedSessions',
      key: 'completedSessions',
      render: (sessions: InterviewSession[]) => sessions.length,
    },
    {
      title: 'Latest Score',
      key: 'latestScore',
      render: (record: Candidate) => {
        if (record.completedSessions.length === 0) {
          return <Tag>No completed interviews</Tag>;
        }
        const latestSession = record.completedSessions[record.completedSessions.length - 1];
        return (
          <Space>
            <Text style={{ color: getScoreColor(latestSession.totalScore || 0) }}>
              {Math.round(latestSession.totalScore || 0)}
            </Text>
            {getScoreTag(latestSession.totalScore || 0)}
          </Space>
        );
      },
      sorter: (a: Candidate, b: Candidate) => {
        const aScore = a.completedSessions.length > 0 ? 
          (a.completedSessions[a.completedSessions.length - 1].totalScore || 0) : 0;
        const bScore = b.completedSessions.length > 0 ? 
          (b.completedSessions[b.completedSessions.length - 1].totalScore || 0) : 0;
        return aScore - bScore;
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: Candidate) => {
        if (record.currentSession) {
          return <Tag color="blue">Interview in Progress</Tag>;
        }
        if (record.completedSessions.length > 0) {
          return <Tag color="green">Interview Completed</Tag>;
        }
        return <Tag color="default">Not Started</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Candidate) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => setSelectedCandidate(record)}
            disabled={record.completedSessions.length === 0}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Title level={3}>
          <UserOutlined /> Candidate Dashboard
        </Title>
        <Search
          placeholder="Search candidates by name, email, or phone"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={setSearchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 400 }}
        />
        <Text type="secondary">
          Total candidates: {candidates.length} | 
          Completed interviews: {candidates.filter(c => c.completedSessions.length > 0).length}
        </Text>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredCandidates}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} candidates`,
          }}
        />
      </Card>

      <Modal
        title={`Interview Details - ${selectedCandidate?.name}`}
        open={!!selectedCandidate}
        onCancel={() => setSelectedCandidate(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedCandidate(null)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedCandidate && (
          <div>
            <Descriptions title="Candidate Profile" bordered column={2}>
              <Descriptions.Item label="Name">{selectedCandidate.name}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedCandidate.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{selectedCandidate.phone}</Descriptions.Item>
              <Descriptions.Item label="Profile Complete">
                {selectedCandidate.profileComplete ? (
                  <Tag color="green">Yes</Tag>
                ) : (
                  <Tag color="red">No</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Total Interviews">
                {selectedCandidate.completedSessions.length}
              </Descriptions.Item>
              <Descriptions.Item label="Current Status">
                {selectedCandidate.currentSession ? (
                  <Tag color="blue">Interview in Progress</Tag>
                ) : (
                  <Tag color="default">No active interview</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <Title level={4}>Interview Sessions</Title>
              {selectedCandidate.completedSessions.length === 0 ? (
                <Text type="secondary">No completed interviews</Text>
              ) : (
                selectedCandidate.completedSessions.map((session, index) => (
                  <Card
                    key={session.id}
                    size="small"
                    style={{ marginBottom: 16 }}
                    title={`Session ${index + 1}`}
                    extra={
                      <Space>
                        <Button
                          size="small"
                          onClick={() => setSelectedSession(session)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="small"
                          icon={<MailOutlined />}
                          onClick={() => handleSendEmail(selectedCandidate, session)}
                          loading={sendingEmail}
                        >
                          Send Email
                        </Button>
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownloadResults(selectedCandidate, session)}
                        >
                          Download
                        </Button>
                      </Space>
                    }
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Score: </Text>
                        <Text style={{ color: getScoreColor(session.totalScore || 0) }}>
                          {Math.round(session.totalScore || 0)}/100
                        </Text>
                        <Progress
                          percent={session.totalScore}
                          size="small"
                          style={{ marginLeft: 16, width: 200 }}
                          strokeColor={getScoreColor(session.totalScore || 0)}
                        />
                      </div>
                      <div>
                        <Text strong>Duration: </Text>
                        <Text>
                          {session.startTime.toLocaleString()} - {session.endTime?.toLocaleString()}
                        </Text>
                      </div>
                      <div>
                        <Text strong>AI Summary: </Text>
                        <Text>{session.aiSummary}</Text>
                      </div>
                    </Space>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={`Session Details - ${selectedSession ? new Date(selectedSession.startTime).toLocaleString() : ''}`}
        open={!!selectedSession}
        onCancel={() => setSelectedSession(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedSession(null)}>
            Close
          </Button>,
          <Button 
            key="email" 
            icon={<MailOutlined />}
            onClick={() => selectedCandidate && selectedSession && handleSendEmail(selectedCandidate, selectedSession)}
            loading={sendingEmail}
          >
            Send Email
          </Button>,
          <Button 
            key="download" 
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => selectedCandidate && selectedSession && handleDownloadResults(selectedCandidate, selectedSession)}
          >
            Download Results
          </Button>,
        ]}
        width={900}
      >
        {selectedSession && (
          <div>
            <Descriptions title="Session Overview" bordered column={2}>
              <Descriptions.Item label="Total Score">
                <Text style={{ color: getScoreColor(selectedSession.totalScore || 0) }}>
                  {Math.round(selectedSession.totalScore || 0)}/100
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Questions Answered">
                {selectedSession.questions.length}
              </Descriptions.Item>
              <Descriptions.Item label="Start Time">
                {selectedSession.startTime.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="End Time">
                {selectedSession.endTime?.toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <Title level={4}>Question Details</Title>
              {selectedSession.questions.map((question, index) => (
                <Card
                  key={question.id}
                  size="small"
                  style={{ marginBottom: 16 }}
                  title={`Question ${index + 1} (${question.difficulty.toUpperCase()})`}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Question: </Text>
                      <Text>{question.text}</Text>
                    </div>
                    <div>
                      <Text strong>Answer: </Text>
                      <Text>{question.answer || 'No answer provided'}</Text>
                    </div>
                    <div>
                      <Text strong>Score: </Text>
                      <Text style={{ color: getScoreColor(question.score || 0) }}>
                        {question.score || 0}/100
                      </Text>
                    </div>
                    <div>
                      <Text strong>Feedback: </Text>
                      <Text>{question.feedback}</Text>
                    </div>
                  </Space>
                </Card>
              ))}
            </div>

            <div style={{ marginTop: 24 }}>
              <Title level={4}>AI Summary</Title>
              <Card>
                <Text>{selectedSession.aiSummary}</Text>
              </Card>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InterviewerTab;
