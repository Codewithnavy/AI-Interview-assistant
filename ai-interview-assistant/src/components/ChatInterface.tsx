import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Progress, Typography, Space } from 'antd';
import { SendOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { submitAnswer, moveToNextQuestion, pauseInterview, resumeInterview } from '../store/slices/appSlice';
import { ChatMessage } from '../types';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface ChatInterfaceProps {
  candidateId: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ candidateId }) => {
  const dispatch = useAppDispatch();
  const { candidates } = useAppSelector(state => state.app);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const candidate = candidates.find(c => c.id === candidateId);
  const session = candidate?.currentSession;
  const currentQuestion = session?.questions[session.currentQuestionIndex];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmitAnswer = React.useCallback(async () => {
    if (!currentQuestion || isSubmitting) return;
    
    setIsSubmitting(true);
    const answer = currentAnswer.trim() || 'No answer provided';
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `a-${Date.now()}`,
      type: 'user',
      content: answer,
      timestamp: new Date(),
      questionId: currentQuestion.id,
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Submit answer and move to next question
    dispatch(submitAnswer({
      candidateId,
      questionId: currentQuestion.id,
      answer,
    }));
    
    // Simulate AI processing time
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: `feedback-${Date.now()}`,
        type: 'ai',
        content: 'Answer submitted! Moving to next question...',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      dispatch(moveToNextQuestion(candidateId));
      setCurrentAnswer('');
      setIsSubmitting(false);
    }, 1000);
  }, [currentQuestion, isSubmitting, currentAnswer, candidateId, dispatch]);

  const startTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleSubmitAnswer]);

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsPaused(true);
    dispatch(pauseInterview(candidateId));
  };

  const resumeTimer = () => {
    startTimer();
    setIsPaused(false);
    dispatch(resumeInterview(candidateId));
  };

  useEffect(() => {
    if (currentQuestion && session?.status === 'in-progress') {
      setTimeLeft(currentQuestion.timeLimit);
      setMessages([
        {
          id: `q-${currentQuestion.id}`,
          type: 'ai',
          content: `Question ${session.currentQuestionIndex + 1}/6 (${currentQuestion.difficulty.toUpperCase()}): ${currentQuestion.text}`,
          timestamp: new Date(),
          questionId: currentQuestion.id,
        }
      ]);
      startTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestion, session?.status, session?.currentQuestionIndex, startTimer]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!session || !currentQuestion) return 0;
    return ((session.currentQuestionIndex + 1) / session.questions.length) * 100;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#52c41a';
      case 'medium': return '#faad14';
      case 'hard': return '#ff4d4f';
      default: return '#1890ff';
    }
  };

  if (!session || !currentQuestion) {
    return (
      <Card>
        <Title level={4}>Interview Session Not Found</Title>
        <Text>Please start a new interview session.</Text>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card
        title={
          <Space>
            <span>Interview Progress</span>
            <Progress
              percent={getProgressPercentage()}
              size="small"
              style={{ width: 200 }}
            />
            <span>{session.currentQuestionIndex + 1}/6</span>
          </Space>
        }
        extra={
          <Space>
            {isPaused ? (
              <Button onClick={resumeTimer} type="primary">
                Resume
              </Button>
            ) : (
              <Button onClick={pauseTimer}>
                Pause
              </Button>
            )}
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <ClockCircleOutlined />
            <Text strong style={{ color: timeLeft <= 10 ? '#ff4d4f' : undefined }}>
              Time Left: {formatTime(timeLeft)}
            </Text>
            <Text
              style={{
                color: getDifficultyColor(currentQuestion.difficulty),
                fontWeight: 'bold'
              }}
            >
              {currentQuestion.difficulty.toUpperCase()}
            </Text>
          </Space>
        </div>

        <div
          style={{
            height: 300,
            overflowY: 'auto',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            padding: 16,
            marginBottom: 16,
            backgroundColor: '#fafafa'
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                marginBottom: 12,
                textAlign: msg.type === 'user' ? 'right' : 'left'
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  borderRadius: 12,
                  backgroundColor: msg.type === 'user' ? '#1890ff' : '#fff',
                  color: msg.type === 'user' ? '#fff' : '#000',
                  border: msg.type === 'ai' ? '1px solid #d9d9d9' : 'none',
                  maxWidth: '80%'
                }}
              >
                <Text style={{ color: msg.type === 'user' ? '#fff' : 'inherit' }}>
                  {msg.content}
                </Text>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 4 }}>
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div>
          <TextArea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={4}
            disabled={isSubmitting || isPaused}
            style={{ marginBottom: 16 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmitAnswer}
            disabled={isSubmitting || isPaused}
            loading={isSubmitting}
            size="large"
            block
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ChatInterface;
