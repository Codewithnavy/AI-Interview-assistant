import React from 'react';
import { Modal, Button, Typography, Space, Card } from 'antd';
import { ClockCircleOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setWelcomeBackModal, setCurrentCandidate, resumeInterview, resetInterview } from '../store/slices/appSlice';

const { Title, Text } = Typography;

const WelcomeBackModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { candidates, showWelcomeBackModal } = useAppSelector(state => state.app);

  const incompleteSessions = candidates.filter(candidate => 
    candidate.currentSession && 
    (candidate.currentSession.status === 'in-progress' || candidate.currentSession.status === 'paused')
  );

  const handleResumeInterview = (candidateId: string) => {
    dispatch(setCurrentCandidate(candidateId));
    dispatch(resumeInterview(candidateId));
    dispatch(setWelcomeBackModal(false));
  };

  const handleStartNew = () => {
    dispatch(setCurrentCandidate(undefined));
    dispatch(setWelcomeBackModal(false));
  };

  const handleCancelModal = () => {
    dispatch(setWelcomeBackModal(false));
  };

  const handleResetInterview = (candidateId: string) => {
    dispatch(resetInterview(candidateId));
    dispatch(setWelcomeBackModal(false));
  };

  return (
    <Modal
      title={
        <Space>
          <ClockCircleOutlined />
          <span>Welcome Back!</span>
        </Space>
      }
      open={showWelcomeBackModal}
      onCancel={handleCancelModal}
      footer={null}
      width={600}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={4}>You have unfinished interview sessions</Title>
        <Text type="secondary">
          Choose an option below to continue or start fresh.
        </Text>
      </div>

      {incompleteSessions.map((candidate) => {
        const session = candidate.currentSession!;
        const currentQuestion = session.questions[session.currentQuestionIndex];
        const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100;
        
        return (
          <Card
            key={candidate.id}
            size="small"
            style={{ marginBottom: 16 }}
            title={
              <Space>
                <span>{candidate.name}</span>
                <span style={{ color: '#1890ff' }}>
                  Question {session.currentQuestionIndex + 1}/6
                </span>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Progress: </Text>
                <Text>{Math.round(progress)}% complete</Text>
              </div>
              <div>
                <Text strong>Current Question: </Text>
                <Text>{currentQuestion.text}</Text>
              </div>
              <div>
                <Text strong>Difficulty: </Text>
                <Text style={{
                  color: currentQuestion.difficulty === 'easy' ? '#52c41a' :
                         currentQuestion.difficulty === 'medium' ? '#faad14' : '#ff4d4f'
                }}>
                  {currentQuestion.difficulty.toUpperCase()}
                </Text>
              </div>
              <div>
                <Text strong>Time Limit: </Text>
                <Text>{currentQuestion.timeLimit} seconds</Text>
              </div>
              
              <Space style={{ marginTop: 12 }}>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleResumeInterview(candidate.id)}
                >
                  Resume Interview
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleResetInterview(candidate.id)}
                >
                  Start Over
                </Button>
              </Space>
            </Space>
          </Card>
        );
      })}

      <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
        <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
          Or start a completely new interview session
        </Text>
        <Button size="large" onClick={handleStartNew}>
          Start New Interview
        </Button>
      </div>
    </Modal>
  );
};

export default WelcomeBackModal;
